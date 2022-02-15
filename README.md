# transmission-peers-tracer-termux
Transmission (torrent client, 2.94 tested) peers tracer to run under Termux (JavaScript/Rhino)

### Install
`pkg install libmaxminddb-tools` <br>
Download `gipsp.jar` (bin folder), `rhino1_7R2-dex.jar` (https://github.com/damonkohler/sl4a/blob/master/rhino/rhino_extras.zip) <br>
`unzip -j rhino_extras.zip rhino/rhino1_7R2-dex.jar` <br>
`rm rhino_extras.zip` <br>

### Run
`cat trans-pr-tc.js | dalvikvm -cp rhino1_7R2-dex.jar:gipsp.jar org.mozilla.javascript.tools.shell.Main` <br>
