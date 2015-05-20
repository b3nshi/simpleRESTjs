module.exports = function(Constants, res, api, connections, params) {
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
      toRemoveCallback = function (err, models) {
        var nModels = models.length;
        if (!err) {
          var filterModel = [],
              searchInside = function (mod, j) {
                if (j === (nParams - 1)) {
                  mod[params[j].schema].id(params[j].id).remove();
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
      },
      query = {},
      lastParam = '';

  r[Constants.RESPONSE.STATUS] = [];
  r[Constants.RESPONSE.RESULT] = [];

  if (params[0].id) {
    query['_id'] = params[0].id;
  }

  for (var i = 1; i < nParams; i++) {
    // User want an specific value
    if (params[i].id) {
      lastParam += params[i].schema + '.';
      query[lastParam + '_id'] = params[i].id;
    }
  }
  if (nParams === 1) {
    // Remove record
    sendResponse = true;
    connections[api][params[0].schema].remove(query, callback);
  } else {
    // Find the record to be removed
    connections[api][params[0].schema].find(query, toRemoveCallback);
  }
};
