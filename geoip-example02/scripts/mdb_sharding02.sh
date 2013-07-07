#!/usr/local/bin/bash 
# Usage: bash mdb_sharding02.sh [start|stop|setup]

# Vimage Jail Sample Scripts: mdb_sharding02.sh
#
# Copyright (C) 2013 Yoshi (@gpp256)
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

# shard server x 6, config server x 3, mongos x 3:
# Host: mdb01, IPaddr: 10.1.1.1/24,  shard server:   rs-a-1,   Port: tcp/30000
# Host: mdb02, IPaddr: 10.1.1.2/24,  shard server:   rs-a-2,   Port: tcp/30000
# Host: mdb03, IPaddr: 10.1.1.3/24,  shard server:   rs-b-1,   Port: tcp/30000
# Host: mdb04, IPaddr: 10.1.1.4/24,  shard server:   rs-b-2,   Port: tcp/30000
# Host: mdb05, IPaddr: 10.1.1.5/24,  shard server:   rs-c-1,   Port: tcp/30000
# Host: mdb06, IPaddr: 10.1.1.6/24,  shard server:   rs-c-2,   Port: tcp/30000
# Host: mdb07, IPaddr: 10.1.1.7/24,  config server:  conf-1,   Port: tcp/35000
# Host: mdb08, IPaddr: 10.1.1.8/24,  config server:  conf-2,   Port: tcp/35000
# Host: mdb09, IPaddr: 10.1.1.9/24,  config server:  conf-3,   Port: tcp/35000
# Host: mdb0A, IPaddr: 10.1.1.10/24, mongos:         mongos-1, Port: tcp/40000
# Host: mdb0B, IPaddr: 10.1.1.11/24, mongos:         mongos-2, Port: tcp/40000
# Host: mdb0C, IPaddr: 10.1.1.12/24, mongos:         mongos-3, Port: tcp/40000
# Host: freebsd91(client), IPaddr: 10.1.1.254/24

# Initialize
# ==============
# (パスは環境に合わせて適宜変更する)
MDB_DIR=/var/db/mongodb/shard02
MDB_LOGDIR=${MDB_DIR}/log
MDB_PIDDIR=${MDB_DIR}/pid
MDB_DATADIR=${MDB_DIR}/data
MONGOD=/usr/local/bin/mongod
MONGOS=/usr/local/bin/mongos
RS_MEMBER="rs-a-1 rs-a-2 rs-b-1 rs-b-2 rs-c-1 rs-c-2"
CONFIG_MEMBER="conf-1 conf-2 conf-3"
MONGOS_MEMBER="mongos-1 mongos-2 mongos-3"
RS_PORT=30000
CONFIG_PORT=35000
MONGOS_PORT=40000
CONFIG_DB="10.1.1.7:${CONFIG_PORT},10.1.1.8:${CONFIG_PORT},10.1.1.9:${CONFIG_PORT}"

# Subroutines
# ==============
# invoke commands
invoke_cmds() {
	cat <<-END_OF_LINE
	=====================================================
	 COMMANDS: $@
	=====================================================
END_OF_LINE
	eval $@ 2>/dev/null; echo
}

# start vm
start_vm() {
	ifconfig epair create # epair0
	ifconfig epair0a 10.1.1.254 netmask 255.255.255.0
	ifconfig epair0b up
	ifconfig bridge create
	ifconfig bridge0 up
	ifconfig bridge0 addm epair0b
	for num in `jot - 1 12`; do
		hname=`echo $num | awk '{printf("mdb%02X", $0)}'`
		jail -c vnet path=/ name=$hname persist
		# epairのup前にlo0をupする必要有。upしない場合、自身と通信できなくなる
		jexec $hname ifconfig lo0 localhost up
		jexec $hname hostname $hname
		sleep 1; # lo0 upを待ち合わせないと通信できなくなることがある
		ifconfig epair create # epair1..12
		ifconfig epair${num}a vnet $hname
		jexec $hname ifconfig epair${num}a 10.1.1.${num} netmask 255.255.255.0
		ifconfig epair${num}b up
		ifconfig bridge0 addm epair${num}b
		#jexec $hname sh /usr/local/etc/ipfw.rules
		jexec $hname arp -d -a
	done
}

# stop vm
stop_vm() {
	ifconfig epair0a destroy
	for num in `jot - 1 12`; do
		hname=`echo $num | awk '{printf("mdb%02X", $0)}'`
		jail -r $hname; 
		ifconfig epair${num}a destroy; ifconfig epair${num}b destroy
	done
	ifconfig bridge0 destroy
}

# wait till MongoDB services start completely
check_start() {
	wait_time=10
	while [ $wait_time -gt 0 ] ; do
		pid=`cat $1`
		if [ "x$pid" != "x" ] ; then
			kill -0 $pid 2>/dev/null && return 0
		fi
		sleep 1; wait_time=`expr $wait_time \- 1`
	done
	return 1
}

# wait till MongoDB services stop completely
check_stop() {
	wait_time=10
	while [ $wait_time -gt 0 ] ; do
		kill -0 $1 2>/dev/null || return 0
		sleep 1; wait_time=`expr $wait_time \- 1`
	done
	return 1
}

# start mongodb
start_mdb() {
	mkdir -p ${MDB_DIR}
	for d in log pid data ; do
		[ -e ${MDB_DIR}/${d} ] && continue
		mkdir -p ${MDB_DIR}/${d}
	done
	chown -R mongodb:mongodb ${MDB_DIR}

	cols=(`echo $RS_MEMBER $CONFIG_MEMBER $MONGOS_MEMBER`)
	for n in `jot - 1 ${#cols[@]}`; do
		dbname=${cols[$n-1]}
		hname=`echo $n | awk '{printf("mdb%02X", $0)}'`
		if [ ! -d ${MDB_DATADIR}/${dbname} -a "x${dbname:0:2}" != "xmo" ] ; then
			mkdir -p ${MDB_DATADIR}/${dbname}
			chown -R mongodb:mongodb ${MDB_DATADIR}/${dbname}
		fi
		if [ -e ${MDB_PIDDIR}/${dbname}.pid ] ; then
			kill -0 `cat ${MDB_PIDDIR}/${dbname}.pid` 2>/dev/null && continue
		fi
		case ${dbname:0:2} in 
			rs)	
				jexec $hname sudo -u mongodb $MONGOD --shardsvr --fork \
					--port $RS_PORT --nojournal \
					--logpath ${MDB_LOGDIR}/${dbname}.log \
					--pidfilepath ${MDB_PIDDIR}/${dbname}.pid \
					--dbpath ${MDB_DATADIR}/${dbname} >/dev/null 2>&1 ;;
			co)
				jexec $hname sudo -u mongodb $MONGOD --configsvr --fork \
					--port $CONFIG_PORT --nojournal \
					--logpath ${MDB_LOGDIR}/${dbname}.log \
					--pidfilepath ${MDB_PIDDIR}/${dbname}.pid \
					--dbpath ${MDB_DATADIR}/${dbname} >/dev/null 2>&1 ;;
			*)
				jexec $hname sudo -u mongodb $MONGOS --fork --chunkSize 10 \
					--port $MONGOS_PORT --configdb $CONFIG_DB \
					--logpath ${MDB_LOGDIR}/${dbname}.log \
					--pidfilepath ${MDB_PIDDIR}/${dbname}.pid >/dev/null 2>&1 ;;
		esac
		check_start ${MDB_PIDDIR}/${dbname}.pid
		if [ $? -ne 0 ] ; then
			echo "failed to start mdb.: dbname=$dbname"; break
		fi
	done
	wait_time=60
	while [ $wait_time -gt 0 ] ; do
		sockstat -l | grep -q mongos 2>/dev/null && break
		sleep 1; wait_time=`expr $wait_time \- 1`
	done
	invoke_cmds "sockstat -l | grep mongo"
	return 1
}

# stop mongodb
stop_mdb() {
	cols=(`echo $RS_MEMBER $CONFIG_MEMBER $MONGOS_MEMBER`)
	for n in `jot - 1 ${#cols[@]}`; do
		dbname=${cols[$n-1]}
		[ -e ${MDB_PIDDIR}/${dbname}.pid ] || return 0
		pid=`cat ${MDB_PIDDIR}/${dbname}.pid`
		kill -0 $pid 2>/dev/null && kill $pid
		check_stop $pid
		[ $? -eq 0 ] || echo "failed to stop mdb.: dbname=$dbname"; 
	done
	rm -rf ${MDB_DIR}
}

# start vm and mongodb
start() {
	vm_num=`jls -s 2>/dev/null | wc -l`
	if [ $vm_num -ne 0 ]; then
		echo 'this program is already started.'; exit 1
	fi
	start_vm >/dev/null 2>&1
	start_mdb
}

# stop vm and mongodb
stop() {
	stop_mdb
	vm_num=`jls -s 2>/dev/null | wc -l`
	[ $vm_num -gt 0 ] && stop_vm >/dev/null 2>&1
}

# set up shard clusters
setup() {
	for n in `jot - 1 6`; do 
	invoke_cmds "echo 'sh.addShard(\"10.1.1.${n}:${RS_PORT}\");' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	done
	invoke_cmds "echo -e 'use admin;\n db.runCommand({listshards: 1});' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo 'db.getSiblingDB(\"config\").shards.find();' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo 'sh.enableSharding(\"fluentd\");' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo 'db.getSiblingDB(\"config\").databases.find();' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo -e 'use fluentd;\n db.apache_access.ensureIndex({time:1,host:1});' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo -e 'use fluentd;\n db.apache_access.getIndexes();' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo 'sh.shardCollection(\"fluentd.apache_access\", {time:1,host:1});' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo 'db.getSiblingDB(\"config\").collections.findOne();' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo 'sh.status()' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	# add data
	# e.g. for n in `jot - 1 3`; do echo --- $n --- ; ruby load.rb ; done
	invoke_cmds "echo -e 'use config;\n db.chunks.count();' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	invoke_cmds "echo -e 'use fluentd;\n db.apache_access.stats()' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	# check shard status
	#for n in `jot - 1 10`; do
	#	sleep 3; echo --- $n ---; invoke_cmds "echo 'sh.status()' | mongo --quiet 10.1.1.10:${MONGOS_PORT}/admin"
	#done
}

# Main Routine
# ==============
case $1 in 
	start)	start ;;
	stop)	stop  ;;
	setup)	setup ;;
	*)
		echo "Usage: $0 {start|stop|setup}"; exit 1 ;;
esac
exit 0
