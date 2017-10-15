var firebase       = require('firebase'),
    admin          = require('firebase-admin'),
    include        = require('../include').include,
    serviceAccount = include("/firebase-admin-creds.json");
    require('dotenv').config();
