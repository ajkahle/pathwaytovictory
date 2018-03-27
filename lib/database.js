var pg            = require('pg'),
    async         = require('async'),
    url           = require('url');
    require('dotenv').config();

/**
 * Sets the maximum number of clients in the pool to 50
**/
pg.defaults.poolSize = 50;

/**
  * Parses the database URL to connect to the Postgres server
  * @param {string} dbUrl - Postgres URL to be parsed for connection
  * @param {boolean} ssl - Boolean value for SSL encryption
**/
var parse = function(dbUrl,ssl){
  var params        = url.parse(dbUrl);
      auth          = params.auth.split(':');

  return {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl:ssl
  };
};

/**
  * SSL set globally in .env file
  * SSL should be true when deployed for all Heroku or AWS databases
  * SSL should be false when running locally for all local databases
**/
var ssl = true;
if(process.env.DATABASE_SSL==="FALSE"){
  ssl = false;
}

/**
  Create the connection with the pool of clients
**/
var schema        = process.env.SCHEMA,
    pool          = new pg.Pool(parse(process.env.DATABASE_URL,ssl));

exports.schema = process.env.SCHEMA;

pool.on('error', function (err, client) {
  console.error('idle client error', err.message, err.stack);
});

/**
  * Function to perform a one-time query and return the values
  * @param {string} text - SQL query to execute
  * @param {values} array - Can be skipped or null; substitues data for all $ variables in the query based on index of array; length of array must match number of $ variables
  * @param {function} callback - Function returning err and data values
**/
var query = function (text, values, callback) {
  return pool.query(text, values, callback);
};

/**
  * Function to create a lasting session from the pool
  * @param {function} callback - Function returning err, client for querying the database, and done function for closing the connection
  * WARNING - Must call done() after query is through to return the connection to the pool to avoid pool limit errors
**/
var connect = function (callback) {
  return pool.connect(callback);
};

exports.query = query;
exports.connect = connect;

var buildInsert = function(theDATA, section) {
    // 'section' maps to what table to insert into
    // the data is the JSON data
    var statement = 'INSERT INTO ' + section + '( ';
    statement += Object.keys(theDATA).toString(',');
    statement += ',created_at) VALUES ';
    return statement;
};

var buildStatement = function(insert, keystore, row, table, conflict, returnFieldArr=[]){
    const params = [];
    const chunks = [];
    // If returnFieldArr is not null, we add params to allow returning
    // fields that are listed in the array. If null, returning statement isn't added.
    let returning = '';
    if (returnFieldArr.length !== 0) {
        returning = ' RETURNING ' + returnFieldArr.toString();
    }
    let update = '';

      Object.keys(keystore).forEach(function(d,i){
        update += d + "=$"+(i+1)+",";
        params.push(row[d]);
      });

    update += 'params=$'+(Object.keys(keystore).length+1)+',updated_at=current_timestamp ';

        valueClause = params.map(function(d,i){
          return "$"+(i+1);
        });
        chunks.push('(' + valueClause.join(', ') + ',current_timestamp)');
    return {
        text: insert + chunks.join(', '),
        values: params
    };
};

// schema, table, data, column reference
// loop through data, whenever finds match it maps to passed in dictionary with its matching property
// data jsonb gets dumped to other column with everything
// writeData takes in ONE row
var writeData = function(schema, tableName, data, keystore, conflict, returning, cb)
{

  var syntax =  buildStatement(buildInsert(keystore,schema+"."+tableName),keystore,data,tableName,conflict,returning);
    query(syntax.text,syntax.values,function(err,returnData){
      if(err){
        console.log(err);
      }
      return cb(err,returnData);
    });
};

exports.writeData = writeData;
