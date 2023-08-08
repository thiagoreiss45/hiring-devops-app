var mongoose = require('mongoose');
var statsd = require('./statsd');
require('dotenv').config();
var schema = mongoose.Schema({value: String});
var values = mongoose.model('values', schema);

module.exports = {
    connectDB: function() {
        // Utilize process.env.MONGODB_ADDON_URI para acessar o valor da variável no arquivo .env
        mongoose.connect(process.env.MONGODB_ADDON_URI, { useNewUrlParser: true })
            .then(() => {
                console.log('Ok');
            })
            .catch((err) => {
                console.error('', err.message);
            });
    },
    updateGauge : function() {
        values.count(function(err, result) {
            if(!err) {
                statsd.gauge('values', result);
            }
        })
    },

    getVal : function(res) {
        values.find(function(err, result) {
            if (err) {
                console.log(err);
                res.send('database error');
                return
            }
            var values = {};
            for (var i in result) {
                var val = result[i];
                values[val["_id"]] = val["value"]
            }
            var title = process.env.TITLE || 'Meteor DevOps Hiring !!'
            res.render('index', {title, values: values});
        });
    },

    sendVal : function(val, res) {
        var request = new values({value: val});
        request.save((err, result) => {
            if (err) {
                console.log(err);
                res.send(JSON.stringify({status: "error", value: "Error, db request failed"}));
                return
            }
            this.updateGauge();
            statsd.increment('creations');
            res.status(201).send(JSON.stringify({status: "ok", value: result["value"], id: result["_id"]}));
        });
    },

    delVal : function(id) {
        values.remove({_id: id}, (err) => {
            if (err) {
                console.log(err);
            }
            this.updateGauge();
            statsd.increment('deletions');
        });
    }
};
