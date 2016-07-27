var builder = require('botbuilder');
var messages = require('./messages');
var data = require('./data');
var dcommand = require('./dialog');
var query = require('./func');


var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});


var bot = new builder.UniversalBot(connector); 
bot.dialog('/', dcommand);

module.exports.connector = connector;

bot.dialog('/changew',  [
    function (session) { 
         console.log('changew 1');
         builder.Prompts.text(session, 'минутку'); 
         query.changeWork(session); 
         session.endDialog();                      
    }
]);

bot.dialog('/changewResult',  [
    function (session, profs) { 
        console.log('changewResult 1');         
        builder.Prompts.text(session, profs + '\n\n' + messages.select);                   
    },
    function (session, results) {
        console.log('changewResult 2');

        var profIds = Array();
        if (results.response && session.userData.profession_list)
        {
            var profs = results.response.split(/\D+/);          
            for (var i = 0; i < profs.length; i++) {
                var id = Number(profs[i]);
                if (id && id > 0) {
                    profIds[profIds.length] = session.userData.profession_list[id-1].id;   
                }                       
            }                      
        }  

        if (profIds.length > 0) {
            data.setProfs(session.message, profIds);            
        }

        if (profIds.length > 0) {
            session.endDialog(messages.goоdMessage);                
            var timeDate = new Date();           
            data.setTimeSend(session.message, timeDate.getTime());                
            timeDate.setDate(timeDate.getDate() - 3);
            query.sendWork(timeDate.getTime(), bot, data.user(session.message));
        } else {
            session.endDialog(messages.badMessage); 
        }        
    }
]);

bot.dialog('/start',  [
    function (session) {  
        
        if (!data.user(session.message).profs) {
            session.endDialog(); 
            session.beginDialog('/changew');
        } else {
            session.endDialog(messages.goоdMessage); 
            var timeDate = new Date();           
            data.setTimeSend(session.message, timeDate.getTime());                
            timeDate.setDate(timeDate.getDate() - 3);
            query.sendWork(timeDate.getTime(), bot, data.user(session.message));                          
        }        
    },
    function (session, results) {        
           
    }
]);

bot.dialog('/stop',  [
    function (session) {  
        data.setTimeSend(session.message, null);  
        session.send(messages.shutdownMessage);
        session.endDialog();          
    },
    function (session, results) {        
           
    }
]);

bot.dialog('/restartNew',  [
    function (session) {  
        data.removeUser(session.message, function () {
            session.endDialog(); 
            session.beginDialog('/'); 
        });           
    },
    function (session, results) {        
           
    }
]);

bot.dialog('/setresource',  [
    function (session, profs) { 
        console.log('setresource 1');         
        builder.Prompts.text(session, messages.selectArea);                   
    },
    function (session, results) { 
        console.log('setresource 2');            
        if (results.response) {
            var str = results.response;
            if (str[str.length-1] == '/') {
                str = str.substring(0, str.length - 1)
            }

            if (str == 'http://jobs.staya.vc') {
                str = null;
            }

            data.setArea(session.message, str);  
        }  

        session.endDialog(); 
        session.beginDialog('/start');      
    }
]);

bot.dialog('/test',  [
    function (session) { 
        console.log('test 1'); 
        var user = data.user(session.message);
        var area = (user.area) ? user.area : 'http://jobs.staya.vc';
        session.endDialog('time ' + user.time + ' profs ' + user.profs.join(',') + ' address ' + user.address.user.id + ' area ' + area);          
    },
    function (session, results) {        
        console.log('test 2');    
    }   
]);

bot.dialog('/adquery',  [
    function (session) { 
        console.log('adquery 1'); 
        data.getUserDb(session.message, function (user) {
            var area = (user && user.area) ? user.area : 'http://jobs.staya.vc';
            var str = (user) ? ('time ' + user.time + ' profs ' + user.profs + ' address ' + JSON.parse(user.address).user.id + ' area ' + area) : 'user not exists';
            session.endDialog(str);   
        });       
                 
    },
    function (session, results) {        
        console.log('adquery 2');    
    }   
]);

setInterval(function() {
                users = data.users();                
                for (var id in users) {
                    var user = users[id];
                    if (user && user.time && user.profs) {
                        var newtime = new Date().getTime();
                        if ((newtime - user.time) >= 300000) {
                            var sendtime = user.time; 
                            users[id].time = newtime;
                            data.setTimeSendDb(id, newtime);    
                            query.sendWork(sendtime, bot, user);
                        }
                    }   
                }
                
        }, 300000);   





