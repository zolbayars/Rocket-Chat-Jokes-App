import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import {
    ISlashCommand,
    SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';
import { JokesApp } from '../JokesApp';

export class SendJokesCommand implements ISlashCommand {
    public command = 'joke';
    public i18nParamsExample = 'SendJoke_Command_Example';
    public i18nDescription = 'SendJoke_Command_Description';
    public providesPreview = false;

    constructor(private readonly app: JokesApp) { }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp): Promise<void> {
        const message = await modify.getCreator().startMessage();
        const sender = await read.getUserReader().getByUsername(context.getSender().username);

        const room = await read.getRoomReader().getById(context.getRoom().id);
        const roomEph = context.getRoom();

        if (!room) {
            throw Error('No room is configured for the message');
        }

        message.setSender(sender);

        try {
            const result = await http.get(`http://api.icndb.com/jokes/random`);
            if (result.data.type === 'success') {
                const joke = result.data.value.joke.replace(/&quot;/g, '\"');
                message
                    .setRoom(room)
                    .setText(joke);
                modify.getCreator().finish(message);
            } else {
                throw new Error('Could not get the joke');
            }
        } catch (error) {
            message
                .setRoom(roomEph)
                .setText(error.message);
            modify.getNotifier().notifyRoom(roomEph, message.getMessage());
        }
    }
}
