var casper = require('casper').create()
  , fs = require('fs');

var current_members = []
  , old_members     = []
  , members         = fs.open('listserve.txt', 'r').read().split(',')
  , stream          = fs.open('output.txt', 'w')
  , password        = casper.cli.get(0);

casper.start('https://phonedirectory.vanderbilt.edu/cdb/', function() {
  this.fill('form#loginForm', {
    'login':    'gilletmh',
    'password': password
  }, true);
});

var searchForStudent = function(first, last, email) {
  casper.then(function() {
    this.fill('form[name=searchForm]', {
      'First':   first,
      'Last':    last,
      'IsStaff': false
    }, true);
  });

  casper.then(function() {
    var raw = this.fetchText('.resulttable');
    var regex = /Name:(.+)\n+Email:(.+)\n+.+\n+Class:(.+)/
    var match = regex.exec(raw);
    if (match) {
      console.log(match[1]);
      current_members.push({
        name:  match[1],
        email: match[2],
        year: match[3]
      });
    } else {
      old_members.push({
        email: email
      });
    }
  });
};

var writeAllInfo = function() {
  for (var i = 0; i < current_members.length; i++) {
    var obj = current_members[i];
    stream.writeLine('Name: '+obj.name);
    stream.writeLine('Email: '+obj.email);
    stream.writeLine('Class: '+obj.year);
  }
};

var writeEmailList = function() {
  var clength = current_members.length;
  var glength = old_members.length;

  stream.writeLine('');
  stream.writeLine('Current members:');

  // Output current member list
  for (var i = 0; i < clength; i++) {
    var obj = current_members[i];
    stream.writeLine(obj.email+',');
  }

  stream.writeLine('');
  stream.writeLine('Graduated members:');

  // Output graduated member list
  for (var i = 0; i < glength; i++) {
    var obj = old_members[i];
    stream.writeLine(obj.email+',');
  }
};

casper.then(function() {
  members.forEach(function(e, i) {
    var email = e.trim();
    var fname = e.match(/([a-zA-Z]+)\./)[1];
    var lname = e.match(/([a-zA-Z]+)@/)[1];
    searchForStudent(fname, lname, email);
  });
});

casper.then(function() {
  writeAllInfo();
  writeEmailList();
  stream.close();
});

casper.run();
