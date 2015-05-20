module.exports = function(Constants, res, api, connections, params, data) {
  var nParams = params.length,
      r = {},
      sendResponse = false,
      callback = function (err, model) {
        if (err) {
          r[Constants.RESPONSE.STATUS].push(Constants.RESPONSE.STATUS_ERROR);
          r[Constants.RESPONSE.RESULT].push(err);
        } else {
          r[Constants.RESPONSE.STATUS].push(Constants.RESPONSE.STATUS_OK);
          r[Constants.RESPONSE.RESULT].push(model);
        }
        if (sendResponse) {
          res.send(r);
        }
      },
      toPushCallback = function (err, models) {
        var nModels = models.length;
        if (!err) {
          var filterModel = [],
              searchInside = function (mod, j) {
                if (j === (nParams - 1)) {
                  mod[params[j].schema].push(data);
                } else {
                  mod[params[j].schema] = searchInside(mod[params[j].schema].id(params[j].id), j+1);
                }
                return mod;
              };
          // Review this to make one call to save an array of models
          for (var i = 0; i < nModels; i++) {
            models[i] = searchInside(models[i], 1);
            if (i === (nModels - 1)) {
              sendResponse = true;
            }
            models[i].save(callback);
          }
        } else {
          r[Constants.RESPONSE.STATUS] = Constants.RESPONSE.STATUS_ERROR;
          r[Constants.RESPONSE.RESULT] = err;
          res.send(r);
        }
      };

  r[Constants.RESPONSE.STATUS] = [];
  r[Constants.RESPONSE.RESULT] = [];

  // Insert one document
  if (nParams === 1) {
    sendResponse = true;
    params = params[0]; // Overwrite the params value.
    if (connections[api][Constants.COUNTERSLIST][params.schema]) {
      connections.saveSequence(connections[api][Constants.COUNTERS], params.schema, function (err, res) {
        if (!err) {
          data[res.field] = res['seq'];
          var model = new connections[api][params.schema](data);
          model.save(callback);
        }
      });
    } else {
      var model = new connections[api][params.schema](data);
      model.save(callback);
    }
  } else {
    // Get the model push the data and then save it
    var query = {},
        i = 0,
        lastParam = '';

    if (params[i].id) {
      query['_id'] = params[i].id;
    }

    for (i = 1; i < (nParams - 1); i++) {
      // User want an specific value
      if (params[i].id) {
        lastParam += params[i].schema + '.';
        query[lastParam + '_id'] = params[i].id;
      }
    }

    if (connections[api][Constants.COUNTERSLIST][params[0].schema+params[i].schema]) {
      connections.saveSequence(connections[api][Constants.COUNTERS],
        // name of counter
        params[0].schema+params[i].schema+params[i-1].id, function (err, result) {
          if (!err) {
            data[result.field] = result['seq'];
            // Find the record to be updated with the post
            connections[api][params[0].schema].find(query, toPushCallback);
          } else {
            r[Constants.RESPONSE.STATUS] = Constants.RESPONSE.STATUS_ERROR;
            r[Constants.RESPONSE.RESULT] = err;
            res.send(r);
          }
        },
        connections[api][Constants.COUNTERSLIST][params[0].schema+params[i].schema]);
    } else {
      // Find the record to be updated with the post
      connections[api][params[0].schema].find(query, toPushCallback);
    }
  }
}
