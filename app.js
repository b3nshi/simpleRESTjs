var Debug = require('debug')('development'),
    Express = require('express'),
    Path = require('path'),
    Fs = require('fs'),
    // Favicon = require('serve-favicon'),
    Logger = require('morgan'),
    CookieParser = require('cookie-parser'),
    BodyParser = require('body-parser'),
    Mongoose = require('mongoose'),
    Constants = require('./config/constants.js'),
    Schema = Mongoose.Schema;

var app = Express();

// First get the API Config files.
var apiDir = './api/',
    files = Fs.readdirSync(apiDir),
    connections = {};

// Read every API file.
files.forEach(function (file) {
  // Get the JSON file which contains the API Info.
  var api = require( apiDir + file);

  Debug('API:' + file);
  // Expected server: mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
  connections[api.name] = Mongoose.createConnection(api.mongo.server, function (err, res) {
    if (err)
      throw err;
    Debug('Connected to ' + api.mongo.server);
  });

  var hasSchemaCounter = false,
      createSchemaCounter = function () {
        connections[api.name][Constants.COUNTERS] =
            connections[api.name].model(Constants.COUNTERS, new Schema({
              '_id': {'type': 'String'},
              'seq': {'type': 'Number'},
              'field': {'type': 'String'}
            }));
        connections[api.name][Constants.COUNTERSLIST] = {};
      },
      countersToCreate = {};

  // Generate embedded schemas
  connections[api.name][Constants.EMBEDDED] = {};

  api.embedded.forEach(function (doc) {
    var fieldsKeys = Object.keys(doc.fields);
    fieldsKeys.forEach(function (field) {
      if (doc.fields[field].type === 'auto_increment') {
        doc.fields[field].type = doc.fields[field].type.replace('auto_increment', 'Number');

        if (!hasSchemaCounter) {
          createSchemaCounter();
          hasSchemaCounter = true;
        }

        countersToCreate[doc.name] = field;
      }
    });

    connections[api.name][Constants.EMBEDDED][doc.name] = new Schema(doc.fields);
  });

  // Adding models to mongoose connections.
  var hasCounter = false;
  api.schemas.forEach(function (schema) {
    Debug('Schema:' + schema.name);
    var fieldsKeys = Object.keys(schema.fields);
    fieldsKeys.forEach(function (field) {

      if (schema.fields[field].type === 'auto_increment') {
        schema.fields[field].type = schema.fields[field].type.replace('auto_increment', 'Number');

        if (!hasSchemaCounter) {
          createSchemaCounter();
          hasSchemaCounter = true;
        }

        // Just one auto_increment value per "table".
        var modelCounter = new connections[api.name][Constants.COUNTERS]({
          '_id': schema.name,
          'seq': 0,
          'field': field
        });

        modelCounter.save(function (err) {
          if (!err) {
            Debug('new counter created')
          }
        });
        connections[api.name][Constants.COUNTERSLIST][schema.name] = field;
        hasCounter = true;
      }

      if (schema.fields[field].type === 'Embedded') {
        // First I need to create the autoincrement field
        if (countersToCreate[schema.fields[field].document]) {
          var nameCounter = schema.name + schema.fields[field].document;

          if (!hasSchemaCounter) {
            createSchemaCounter();
            hasSchemaCounter = true;
          }

          connections[api.name][Constants.COUNTERSLIST][nameCounter] =
              countersToCreate[schema.fields[field].document];
          hasCounter = true;
        }

        // Now I can replace the field by the Schema
        if (schema.fields[field].max === 'n') {
          schema.fields[field] = [connections[api.name][Constants.EMBEDDED][schema.fields[field].document]];
        } else {
          schema.fields[field] = connections[api.name][Constants.EMBEDDED][schema.fields[field].document];
        }
      }
    });

    connections[api.name][schema.name] =
        connections[api.name].model(schema.name, new Schema(schema.fields));
  });

  // If has one counter, then I need the function to get next value.
  if (hasCounter) {
    connections.saveSequence = function (counter, name, callback, param) {
      // This should be converted to an upsert.
      counter.findById(name,function (err, result) {
        if (!err) {
          if (result) {
            counter.findOneAndUpdate(
              {_id: name },
              {$inc: { seq: 1 }},
              {new: true},
              callback
            );
          } else {
            var newCounter = new counter({
              _id: name,
              field: param,
              seq: 1
            });
            newCounter.save(callback);
          }
        } else {
          callback();
        }
      });
    };
  }
});

// Include the file to work with apis
var apis = require('./routes/apis')(Debug, Express, Mongoose, Constants, connections);

// view engine setup
app.set('views', Path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(Favicon(__dirname + '/public/favicon.ico'));
app.use(Logger('dev'));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: false }));
app.use(CookieParser());
app.use(Express.static(Path.join(__dirname, 'public')));

app.use('/', apis);

// catch home page, without an API id.
app.use('/', function (req, res) {
  res.render('index', {
    title: 'Welcome to simpleRESTjs'
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
