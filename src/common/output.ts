"user strict";
import {window, OutputChannel} from "vscode";

export class Output {

    public static debug(value: any) {
        this.log(value, false)
    }

    public static log(value: any, showLog = true) {
        if (this.outputChannel == null) {
            this.outputChannel = window.createOutputChannel("vsc-markdown");
        }
        if (showLog) this.outputChannel.show(true);
        this.outputChannel.appendLine(`${value}`);
        this.outputChannel.appendLine("-----------------------------------------------------------------------------------------");
    }

    private static outputChannel: OutputChannel;
}
