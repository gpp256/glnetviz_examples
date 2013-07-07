#!/usr/bin/perl
#
# create_cgi.pl
#
# Copyright (c) 2013 Yoshi 
# This software is distributed under the MIT License.(../MIT-LICENSE.txt)
#
use JSON::PP;
use Data::Dumper;

open (DATA, "<map_reduce_apache.log") or exit 1;
my @lines = <DATA>;
close (DATA);

my $threshold = 30;
my $dlist = {};
foreach (@lines) {
	next unless (/_id/);
	chomp;
	my $line = decode_json $_;
	next if ($line->{'value'} < $threshold || $line->{'_id'}->{'host'} =~ /^192\.168\.1\./);
#	printf ("%s\n", Data::Dumper->Dump([$line], [list]));
	$dlist->{$line->{'_id'}->{'time'}} = [] if (!exists $dlist->{$line->{'_id'}->{'time'}}) ;
	my %location = ();
	&getGeolocation($line->{'_id'}->{'host'}, \%location);
	push @{$dlist->{$line->{'_id'}->{'time'}}}, {
		ip   => $line->{'_id'}->{'host'},
#		ip   => '?.?.?.?',
		num  => $line->{'value'},
		lat  => (exists $location{lat}) ? $location{lat} : '',
		lon  => (exists $location{lon}) ? $location{lon} : '',
		code => (exists $location{code}) ? $location{code} : '',
	};
}
#printf ("%s\n", Data::Dumper->Dump([$dlist], [list]));
&printResult(encode_json $dlist);
exit 0;

sub getGeolocation {
	my $ip = shift; 
	my $output = shift;
	my $cmdpath = '/opt/glNetViz/examples/geoip-example01';
	my @lines = `(cd $cmdpath ; perl get_geolocation.cgi 0 $ip 2>/dev/null)`;
	return if ($? >> 8);
	my $line = decode_json $lines[-1];
	return if ($line->{ret} != 0);
	$output->{code} = $line->{c_code};
	$output->{lat} = $line->{lat};
	$output->{lon} = $line->{lon};
}

sub printResult {
	my $lines = shift;
	my $ret = shift || 0;
	print <<END_OF_LINE;
Content-Type: application/json, charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 1728000

$lines
END_OF_LINE
	exit($ret);
}
__END__
$list = {
          'value' => 32,
          '_id' => {
                     'time' => '2013-06-30 23:00:00',
                     'host' => '66.249.74.9'
                   }
        };

