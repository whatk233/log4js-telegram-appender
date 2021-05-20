'use strict';

const got = require("got");

// This is the function that generates an appender function
function stdoutAppender(layout, levels, config) {

    const silentLevel = levels.getLevel(config.silentAlertLevel);
    const audioLevel = levels.getLevel(config.audioAlertLevel);
    const sentMessageRoute = `https://api.telegram.org/bot${config.bottoken}/sendMessage`;
    const botchat_params = {
        searchParams: {
            chat_id: config.botchatid,
            parse_mode: "html"
        }
    };
    // This is the appender function itself
    return async (loggingEvent) => {
        const params = JSON.parse(JSON.stringify(botchat_params));
        if (silentLevel.isLessThanOrEqualTo(loggingEvent.level.levelStr)) {
            //console.log(`===== silentAlertLevel is less than loggingEvent level.`);
            if (audioLevel.isLessThanOrEqualTo(loggingEvent.level.levelStr)) {
                //console.log(`===== log telegram with sound`);
                Object.assign(params.searchParams, {
                    text: layout(loggingEvent),
                    disable_notification: false
                });
                try {
                    await got(sentMessageRoute, params);
                } catch (error) {
                    console.error("Error sending to telegram:");
                    console.error(error);
                }
            } else {
                //console.log(`===== log telegram quietly`);
                Object.assign(params.searchParams, {
                    text: layout(loggingEvent),
                    disable_notification: true
                });
                try {
                    await got(sentMessageRoute, params);
                } catch (error) {
                    console.error("Error sending to telegram:");
                    console.error(error);
                }
            }
        }
    };
}

function configure(config, layouts, findAppender, levels) {

    // the default custom layout for this appender, not using the layouts module
    const default_layout = function(loggingEvent) {
        const header = `<b>${loggingEvent.categoryName}: ${loggingEvent.level}</b>\n`;
        const timestamp = `[${loggingEvent.startTime.toISOString()}]\n`;
        const body = loggingEvent.data.map(d => {
            try {
                if (typeof d === 'object') return JSON.stringify(d);
            } catch (e) {
                //ignore
            }

            return d.toString();
        }).join("\n");
        return header+timestamp+body;
    };

    const use_layout = config.layout ? layouts.layout(config.layout.type, config.layout) : default_layout;

    //create a new appender instance
    return stdoutAppender(use_layout, levels, config);
}

//export the only function needed
exports.configure = configure;