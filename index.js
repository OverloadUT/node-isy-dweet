require('dotenv').load();
var fs = require('fs');

var commandLineArgs = require('command-line-args');
var cli = commandLineArgs([
  { name: 'type', alias: 't', type: RegExp },
  { name: 'name', alias: 'n', type: RegExp },
  { name: 'excludename', type: RegExp, multiple: true, defaultValue: [] }
]);
var options = cli.parse();

var main = function main() {
  var isy = require("isy99")({
    host: process.env.ISY_HOST,
    user: process.env.ISY_USER,
    pass: process.env.ISY_PASS
  });

  isy.request('rest/nodes/devices', function(err, data) {
    var sorted = data.nodes.node.sort(function(a, b) {
      if (a.type < b.type) {
        return -1;
      }
      if (a.type > b.type) {
        return 1;
      }
      // a must be equal to b
      return 0;
    });

    var filtered = sorted.filter(function(device){
      if(!device.enabled) {
        return false;
      }
      if(options.type && !options.type.test(device.type)) {
        return false;
      }
      if(options.name && !options.name.test(device.name)) {
        return false;
      }

      // TODO: this whole thing feels messy as hell. Gotta be a much cleaner way to do it.
      var violates = false;
      options.excludename.forEach(function(exclude) {
        if(exclude.test(device.name)) {
          violates = true;
        }
      });
      if (violates) {
        return false;
      }

      return true;
    });

    var objoutput = {};
    filtered.forEach(function(device){
      objoutput[device.name] = {
        status: "${sys.node." + device.address + ".ST.raw}"
      }
    });

    //var jsonoutput = filtered.map(function(currentValue, index, array) {
    //  return {
    //    name: "${sys.node." + currentValue.address + ".name}",
    //    status: "${sys.node." + currentValue.address + ".ST.raw}"
    //  };
    //});

    jsonoutput = JSON.stringify(objoutput);

    fs.writeFile('output.json', jsonoutput, function(err) {
      console.log(objoutput);
      console.log("Length", jsonoutput.length);
    });

  });
};

main();