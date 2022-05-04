import source from '../db/source.json';
import Logger from '../util/Logger';
import { Message } from "discord.js";
import detect from '../util/ocr';
const c = new Logger('messageCreate');

function buildSearch(substrings: string[]) {
    return new RegExp(
        substrings
            .map(function (s) {
                return s.replace(/[.*+?^${}()|[\]\\]/gi, '\\$&');
            })
            .join('{1,}|') + '{1,}'
        , 'gi');
}

const regexList: RegExp[] = [];
const actionList: {
    action?: string;
    action_cn?: string;
    keywords: string[];
}[] = [];
source.forEach(s => {
    regexList.push(buildSearch(s.keywords));
    actionList.push({ action: s.action, keywords: s.keywords, action_cn: s.action_cn });
});

const $support = '965284036333424722';
const $support_cn = '967477370997076079';
const supportChannels: string[] = [
    $support,
    $support_cn
];

export default async function run(message: Message) {
    if (message.author.bot) return;
    c.trail(`<${message.author.username}#${message.author.discriminator}> ${message.content}`);
    if (!supportChannels.includes(message.channel.id)) return;

    regexList.forEach(async regex => {
        let ocr: string = "";
        await detect(message).then(result => {
            ocr = result;
        }).catch(err => {
            return;
        });
        if (!ocr) ocr = "";
        if (regex.test(message.content) || regex.test(ocr)) {
            const action = actionList.find(a => a.keywords.some(k => regex.test(k)));
            message.react('👀');
            if (action) {
                switch (message.channel.id) {
                    case $support_cn:
                        if (action.action_cn) message.reply(action.action_cn);
                        break;
                    default:
                        if (action.action) message.reply(action.action);
                        break;
                }
                console.log(action);
                c.trail(`Match found for ${action.keywords[0]}`)
            }
        }
    });
}