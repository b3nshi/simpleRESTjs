module.exports = function(Constants, res, api, connections, params, queryParams) {
  var nParams = params.length,
      callback = function (err, model) {
        var r = {};
        if (!err) {
          r[Constants.RESPONSE.STATUS] = Constants.RESPONSE.STATUS_OK;
          if (nParams > 1) {
            var filterModel = [],
                nModels = model.length;
            for (var i = 0; i < nModels; i++) {
              filterModel[i] = model[i];
              for (var j = 1; j < nParams; j++) {
                filterModel[i] = filterModel[i][params[j].schema].id(params[j].id);
              }
            }
            r[Constants.RESPONSE.RESULT] = filterModel;
          } else {
            r[Constants.RESPONSE.RESULT] = model;
          }
        } else {
          r[Constants.RESPONSE.STATUS] = Constants.RESPONSE.STATUS_ERROR;
          r[Constants.RESPONSE.RESULT] = err;
        }
        res.send(r);
      };

  var query = {},
      fields = '',
      lastParam = '',
      extra = {};

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

  // Complete the query with custom filters
  if (queryParams.q) {
    if (typeof queryParams.q === 'string') {
      queryParams.q = [queryParams.q];
    }
    query.$or = [];
    queryParams.q.forEach(function (qOrData) {
      var qAndData = qOrData.split(','),
          andData = {};
      qAndData.forEach(function (and) {
        var qData = and.split('_');
        andData[qData[0]] = qData[1];
      });
      query.$or.push(andData);
    });
  }

  if (queryParams.sort) {
    queryParams.sort = queryParams.sort.replace(/ASC/g, '1').replace(/DESC/g, '-1');
    var sortParams = queryParams.sort.split(',');
    extra['sort'] = {};
    sortParams.forEach(function (sortParam) {
      var sortData = sortParam.split('|');
      extra['sort'][sortData[0]] = sortData[1];
    });
  }

  connections[api][params[0].schema].find(
    query,
    (queryParams.fields) ? queryParams.fields.replace(/\,/g, ' ') : '',
    extra,
    callback
  );
}
