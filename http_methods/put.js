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
      toUpdateCallback = function (err, models) {
        var nModels = models.length;
        if (!err) {
          var filterModel = [],
              searchInside = function (mod, j) {
                if (j === (nParams - 1)) {
                  var modToUpdate = mod[params[j].schema].id(params[j].id),
                      dataKeys = Object.keys(data);

                  dataKeys.forEach(function (dataName) {
                    modToUpdate[dataName] = data[dataName];
                  });
                  // Remove old value
                  mod[params[j].schema].id(params[j].id).remove();
                  // Insert new value
                  mod[params[j].schema].push(modToUpdate);
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
          r[Constants.RESPONSE.STATUS].push(Constants.RESPONSE.STATUS_ERROR);
          r[Constants.RESPONSE.RESULT].push(err);
          res.send(r);
        }
      };

  r[Constants.RESPONSE.STATUS] = [];
  r[Constants.RESPONSE.RESULT] = [];

  // Insert one document
  if (nParams === 1) {
    sendResponse = true;
    params = params[0]; // Overwrite the params value.

    connections[api][params.schema].findById(params.id, function (err, model) {
      if (!err) {
        var dataKeys = Object.keys(data);
        dataKeys.forEach(function (dataName) {
          model[dataName] = data[dataName];
        });
        model.save(callback);
      } else {
        r[Constants.RESPONSE.STATUS].push(Constants.RESPONSE.STATUS_ERROR);
        r[Constants.RESPONSE.RESULT].push(err);
        res.send(r);
      }
    });
  } else {
    // Get the model push the data and then save it
    var query = {},
        i = 0,
        lastParam = '';

    if (params[i].id) {
      query['_id'] = params[i].id;
    }

    for (i = 1; i < nParams; i++) {
      // User want an specific value
      if (params[i].id) {
        lastParam += params[i].schema + '.';
        query[lastParam + '_id'] = params[i].id;
      }
    }

    // Find the record to be updated with the put
    connections[api][params[0].schema].find(query, toUpdateCallback);
  }
}
