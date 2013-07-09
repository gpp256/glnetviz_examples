#!/bin/sh
#
# get_connection_array.cgi
#
# Copyright (c) 2013 Yoshi 
# This software is distributed under the MIT License.(../../MIT-LICENSE.txt)
# 
# e.g.
# Input : start time, end time, proto
# Output: proto num, src ip, src port, dst ip, dst port, packet counter, bytes
cat <<END_OF_LINE
Content-Type: application/json, charset=utf-8
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 1728000

[
[6, "a.b.1.1", 2000,  "c.d.1.1", 21, 392, 2930, 30.0, 31.2, 35.7, 139.6],
[6, "e.f.1.1", 5000,  "c.d.1.1", 22, 32, 20930, -25.2, 133.7, 35.7, 139.6],
[6, "g.h.1.1", 20000, "c.d.1.1", 443, 39, 329009, 56.1, -106.3, 35.7, 139.6]
]
END_OF_LINE
