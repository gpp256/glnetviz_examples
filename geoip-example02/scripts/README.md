The steps to analyze the access log of Apache are as follows.

    e.g.
    # bash -x mdb_sharding02.sh start
    # bash -x mdb_sharding02.sh setup

    # sudo -u admin fluentd -c ~admin/tools/fluentd/fluentd_accesslog.conf -o ~admin/tools/fluentd/apache01.log -d ~admin/tools/fluentd/apache01.pid
    
    $ time cat map_reduce_accesslog.js | mongo --quiet 10.1.1.10:40000/admin 2>/dev/null | tee map_reduce_apache.log

    $ time perl create_cgi.pl | tee apache01.cgi
    $ cp apache01.cgi{,.org}
    $ vi apache01.cgi
    $ diff apache01.cgi{.org,}
    0a1,2
    > #!/bin/sh
    > cat <<END_OF_LINE
    7a10
    > END_OF_LINE
    $ sudo cp apache01.cgi /opt/glNetViz/examples/geoip-example02/
    $ sudo chown www:www /opt/glNetViz/examples/geoip-example02/apache01.cgi
    $ sudo chmod 750 /opt/glNetViz/examples/geoip-example02/apache01.cgi

To do geoip-example02, point your web browser to http://your-web-server/glNetViz/examples/geoip-example02/. 

