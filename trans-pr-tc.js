
forget_time = 120
hosts_period = 30
down_grow = 10.0
sleep_time = 1000
giploc_cmd = ["mmdblookup", "-f", "/data/data/com.termux/files/usr/share/GeoIP/GeoLite2-City.mmdb", "-i" ]

var vp = new java.util.Vector ()
hosts_prev_time = java.lang.System.currentTimeMillis ()
max_upload = "0.0"
var local_zone_id = java.time.ZoneId.ofOffset ("GMT", java.time.ZoneOffset.ofHours (3))
var prev_peer = null
var prev_line_len = 0

function setup_env (benv) {
	if (!benv.containsKey ("LD_LIBRARY_PATH"))
		benv.put ("LD_LIBRARY_PATH", "/data/data/com.termux/files/usr/lib")
	if (!benv.containsKey ("LD_PRELOAD"))
		benv.put ("LD_PRELOAD", "/data/data/com.termux/files/usr/lib/libtermux-exec.so")
}

function tr_info (n) {
	var lst = new java.util.Vector ()
	lst.add ("transmission-remote")
	lst.add ("-t" + n)
	lst.add ("-ip")
	var pbld = new java.lang.ProcessBuilder (lst)
	setup_env (pbld.environment ())
	var p = pbld.start ()
	p.waitFor ()
	var brd = new java.io.BufferedReader (new java.io.InputStreamReader (p.getInputStream ()))
	var l
	if ((l = brd.readLine ()) == null) return null
	var vo = new java.util.Vector ()
	while ((l = brd.readLine ()) != null) {
		var o = new Object ();
		o.ip = l.substring (0,15).trim ()
		o.done = l.substring (34,41).trim ()
		o.down = l.substring (42,48).trim ()
		o.up = l.substring (50,56).trim ()
		o.cl = l.substring (58).trim ()
		vo.add (o)
	}
	return vo
}

function gip_loc (ip) {
	if (typeof giploc_cmd == "undefined") return ""
	var i
	var lst = new java.util.Vector ()
	if (typeof giploc_cmd == "object")
		for (i in giploc_cmd) lst.add (giploc_cmd [i])
	else	lst.add (giploc_cmd)
	lst.add (ip)
	var pbld = new java.lang.ProcessBuilder (lst)
	setup_env (pbld.environment ())
	var prc = pbld.start ()
	prc.waitFor ()
	var brd = new java.io.BufferedReader (new java.io.InputStreamReader (prc.getInputStream ()))
	if (dbpm != null)
		return dbpm.invoke (dbpi, brd)
	return brd.readLine ()
}

function get_torrents () {
	var lst = new java.util.Vector ()
	lst.add ("transmission-remote")
	lst.add ("-l")
	var pbld = new java.lang.ProcessBuilder (lst)
	setup_env (pbld.environment ())
	var p = pbld.start ()
	p.waitFor ()
	var brd = new java.io.BufferedReader (new java.io.InputStreamReader (p.getInputStream ()))
	var l, fl
	if ((l = brd.readLine ()) == null) return null
	var vt = new java.util.Vector ()
	var i = 1, sn
	if ((l = brd.readLine ()) == null) return null
	while ((fl = brd.readLine ()) != null) {
		sn = l.substring (1,5).trim ()
		if (i != parseInt (sn)) return null
		sn = l.substring (69).trim ()
		vt.add (sn)
		i ++
		l = fl
	}
	return vt
}

function setup_dbp (dbpcls) {
	try {
		var dbpctor = dbpcls.getConstructor ()
		dbpctor.setAccessible (true)
		dbpi = dbpctor.newInstance ()
		dbpm = dbpcls.getMethod ("read", java.io.BufferedReader)
		dbpm.setAccessible (true)
		if (typeof lang != "undefined") try {
			var dbpslm = dbpcls.getMethod ("setLang", java.lang.String)
			dbpslm.setAccessible (true)
			dbpslm.invoke (dbpi, lang)
		} catch (e) {}
		return true
	} catch (e) {
		return false
	}
}

function load_dbp () {
	try {
		var dbpcls = java.lang.ClassLoader.getSystemClassLoader ().loadClass ("MMDBRead")
		if (setup_dbp (dbpcls))
			return true
	} catch (e) {}
	try {
		var dclcls = java.lang.Class.forName ("dalvik.system.DexClassLoader")
		var dclctor = dclcls.getConstructor (java.lang.String, java.lang.String,
			java.lang.String, java.lang.ClassLoader)
		var dcli = dclctor.newInstance ("gipsp.jar", null, null, null)
		var dbpcls = dcli.loadClass ("MMDBRead")
		if (setup_dbp (dbpcls))
			return true
	} catch (e) {}
	return false;
}

function wipe_prev_line () {
	var i
	if (prev_line_len == 0) return
	for (i = 0; i < prev_line_len; i++)
		java.lang.System.out.print ('\b')
	for (i = 0; i < prev_line_len; i++)
		java.lang.System.out.print (' ')
	for (i = 0; i < prev_line_len; i++)
		java.lang.System.out.print ('\b')
	prev_line_len = 0
}

function print_peer (p) {
	var fs = p.up.compareTo ("0.0") == 0 ? "-" : ""
	var time = java.time.LocalTime.now (local_zone_id)
	if (p == prev_peer) wipe_prev_line ()
	else if (p != null) java.lang.System.out.println ()
	var sl = 0
	if (p.up != "0.0")
		java.lang.System.out.print ("\033[32m")
	var s = java.lang.String.format ("%02d:%02d:%02d #%-2d %-16s%5s %"+fs+"5s ",
		java.lang.Integer.valueOf (time.getHour ()),
		java.lang.Integer.valueOf (time.getMinute ()),
		java.lang.Integer.valueOf (time.getSecond ()),
		java.lang.Integer.valueOf (p.tn), p.ip, p.done, p.up)
	java.lang.System.out.print (s)
	sl += s.length ()
	if (parseFloat (p.maxup) > parseFloat (p.up)) {
		s = java.lang.String.format ("(%s max) ",  p.maxup)
		sl += s.length ()
		java.lang.System.out.print (s)
	}
	java.lang.System.out.print (p.gloc)
	sl += p.gloc.length () + 1
	if (p.up != "0.0")
		java.lang.System.out.print (" \033[m")
	else	java.lang.System.out.print (' ')
	if (p.iaddr.length != "") {
		java.lang.System.out.print ("\033[36m")
		java.lang.System.out.print (p.iaddr)
		java.lang.System.out.print (" \033[m")
		sl += p.iaddr.length () + 1
	}
	java.lang.System.out.format ("\033[3;90m%s\033[m", p.cl)
	sl += p.cl.length ()
	prev_line_len = sl
	prev_peer = p
}

var tors = get_torrents ()
if (tors == null) {
	java.lang.System.err.println ("\033[31mCan't get number of torrents\033[m")
	quit ()
}
var tn = tors.size ()
if (tn == 0) {
	java.lang.System.err.println ("\033[31mNo torrents added\033[m")
	quit ()
}

print ("\n\t No  IP \t      Done Up\t Peer")

hosts_period *= 60 * 1000
forget_time *= 60 * 1000

var dbpi = null
var dbpm = null
if (typeof giploc_cmd != "undefined" &&
	(typeof giploc_cmd == "string" && giploc_cmd == "mmdblookup" ||
		giploc_cmd [0] == "mmdblookup"))
	if (!load_dbp ()) {
		dbpi = null; dbpm = null
	}

while (true) {

for (var i = 1; i <= tn; i++) {
	var vo, p
	vo = tr_info (i)
	for (var j = 0;  j < vo.size (); j++) {
		p = vo.elementAt (j)
		var f, pp
		f = false
		for (var k = 0; k < vp.size (); k++) {
			pp = vp.elementAt (k)
			if (pp.ip.compareTo (p.ip) == 0) {
				if (parseFloat (p.up) > parseFloat (pp.maxup) ||
					parseFloat (p.done) - parseFloat (pp.done) > down_grow) {
					pp.up = p.up
					if (parseFloat (p.up) > parseFloat (pp.maxup)) pp.maxup = p.up
					if (parseFloat (p.up) > parseFloat (max_upload)) max_upload = p.up
					pp.done = p.done
					print_peer (pp)
				}
				pp.lastac = java.lang.System.currentTimeMillis ()
				f = true
				break
			}
		}
		if (f == false) {
			p.tn = i
			p.lastac = java.lang.System.currentTimeMillis ()
			var gloc = gip_loc (p.ip)
			if (typeof gloc == "string" || gloc.getClass () == java.lang.String)
				p.gloc = gloc; else {
				p.gloc = java.lang.String.valueOf (gloc [0] + " " + gloc [8] + "/" + gloc [9])
			}
			ia = java.net.InetAddress.getByName (p.ip)
			p.iaddr = ia.getCanonicalHostName()
			if (p.iaddr.compareTo (p.ip) == 0) p.iaddr = ""
			vp.add (p)
			p.maxup = p.up
			print_peer (p)
		}
	}
}

do {
	var torm = null
	for (var i = 0; i < vp.size (); i++)
		if (java.lang.System.currentTimeMillis () - vp.elementAt (i).lastac >= forget_time)
		{	torm = vp.elementAt (i); break;	}
	if (torm != null) vp.removeElement (torm)
} while (torm != null)

if (java.lang.System.currentTimeMillis () - hosts_prev_time >= hosts_period) {
	var time = java.time.LocalTime.now (local_zone_id)
	java.lang.System.out.println ()
	java.lang.System.out.format ("%02d:%02d:%02d  %d known hosts, max upload speed: %s",
		java.lang.Integer.valueOf (time.getHour ()),
		java.lang.Integer.valueOf (time.getMinute ()),
		java.lang.Integer.valueOf (time.getSecond ()),
		java.lang.Integer.valueOf (vp.size ()), max_upload)
	hosts_prev_time = java.lang.System.currentTimeMillis ()
	prev_line_len = 0
	prev_peer = null
}
java.lang.Thread.sleep (sleep_time)
}
