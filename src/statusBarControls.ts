import * as vscode from "vscode";

export class Toolbar {
  private countStatus: vscode.StatusBarItem;
  private h1Button: vscode.StatusBarItem;
  private h2Button: vscode.StatusBarItem;
  private h3Button: vscode.StatusBarItem;
  private boldButton: vscode.StatusBarItem;
  private italicButton: vscode.StatusBarItem;
  private listButton: vscode.StatusBarItem;
  private orderedListButton: vscode.StatusBarItem;
  private linkButton: vscode.StatusBarItem;
  private imageButton: vscode.StatusBarItem;
  private codeBlockButton: vscode.StatusBarItem;
  private inlineCodeButton: vscode.StatusBarItem;
  private blockquoteButton: vscode.StatusBarItem;
  private tableButton: vscode.StatusBarItem;
  private strikethroughButton: vscode.StatusBarItem;
  private emptyBlockButton: vscode.StatusBarItem;
  private h4Button: vscode.StatusBarItem;
  private h5Button: vscode.StatusBarItem;

  constructor() {
    this.countStatus = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );

    // Create all toolbar buttons with priority order
    this.h1Button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1015);
    this.h2Button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1014);
    this.h3Button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1013);
    this.h4Button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1012);
    this.h5Button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1011);
    this.boldButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1010);
    this.italicButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1009);
    this.listButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1008);
    this.orderedListButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1007);
    this.linkButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1006);
    this.imageButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1005);
    this.codeBlockButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1004);
    this.inlineCodeButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1003);
    this.blockquoteButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1002);
    this.tableButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1001);
    this.strikethroughButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
    this.emptyBlockButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 999);

    this.setupButtons();
  }

  private setupButtons() {
    this.h1Button.text = "H1";
    this.h1Button.tooltip = new vscode.MarkdownString("**Insert H1 Heading**\n\n`# text` - Largest heading");
    this.h1Button.command = "vsc-markdown.insertH1";

    this.h2Button.text = "H2";
    this.h2Button.tooltip = new vscode.MarkdownString("**Insert H2 Heading**\n\n`## text` - Second level heading");
    this.h2Button.command = "vsc-markdown.insertH2";

    this.h3Button.text = "H3";
    this.h3Button.tooltip = new vscode.MarkdownString("**Insert H3 Heading**\n\n`### text` - Third level heading");
    this.h3Button.command = "vsc-markdown.insertH3";

    this.h4Button.text = "H4";
    this.h4Button.tooltip = new vscode.MarkdownString("**Insert H4 Heading**\n\n`#### text` - Fourth level heading");
    this.h4Button.command = "vsc-markdown.insertH4";

    this.h5Button.text = "H5";
    this.h5Button.tooltip = new vscode.MarkdownString("**Insert H5 Heading**\n\n`##### text` - Fifth level heading");
    this.h5Button.command = "vsc-markdown.insertH5";

    this.boldButton.text = "$(bold)";
    this.boldButton.tooltip = new vscode.MarkdownString("**Insert Bold Text**\n\n`**text**` - Make text bold");
    this.boldButton.command = "vsc-markdown.insertBold";

    this.italicButton.text = "$(italic)";
    this.italicButton.tooltip = new vscode.MarkdownString("**Insert Italic Text**\n\n`*text*` - Make text italic");
    this.italicButton.command = "vsc-markdown.insertItalic";

    this.listButton.text = "$(list-unordered)";
    this.listButton.tooltip = new vscode.MarkdownString("**Insert Unordered List**\n\n`- item` - Create bullet points");
    this.listButton.command = "vsc-markdown.insertList";

    this.orderedListButton.text = "$(list-ordered)";
    this.orderedListButton.tooltip = new vscode.MarkdownString("**Insert Ordered List**\n\n`1. item` - Create numbered list");
    this.orderedListButton.command = "vsc-markdown.insertOrderedList";

    this.linkButton.text = "$(link)";
    this.linkButton.tooltip = new vscode.MarkdownString("**Insert Link**\n\n`[text](url)` - Create hyperlink");
    this.linkButton.command = "vsc-markdown.insertLink";

    this.imageButton.text = "$(file-media)";
    this.imageButton.tooltip = new vscode.MarkdownString("**Insert Image**\n\n`![alt](url)` - Embed image");
    this.imageButton.command = "vsc-markdown.insertImage";

    this.codeBlockButton.text = "$(code)";
    this.codeBlockButton.tooltip = new vscode.MarkdownString("**Insert Code Block**\n\n```\n```code```\n``` \n\nMulti-line code");
    this.codeBlockButton.command = "vsc-markdown.insertCodeBlock";

    this.inlineCodeButton.text = "$(symbol-string)";
    this.inlineCodeButton.tooltip = new vscode.MarkdownString("**Insert Inline Code**\n\n`` `code` `` - Single line code");
    this.inlineCodeButton.command = "vsc-markdown.insertInlineCode";

    this.blockquoteButton.text = "$(quote)";
    this.blockquoteButton.tooltip = new vscode.MarkdownString("**Insert Blockquote**\n\n`> text` - Quote or citation");
    this.blockquoteButton.command = "vsc-markdown.insertBlockquote";

    this.tableButton.text = "$(table)";
    this.tableButton.tooltip = new vscode.MarkdownString("**Insert Table**\n\n```\n|col1|col2|\n|----|----|  \n``` \n\nCreate data table");
    this.tableButton.command = "vsc-markdown.insertTable";

    this.strikethroughButton.text = "$(strikethrough)";
    this.strikethroughButton.tooltip = new vscode.MarkdownString("**Insert Strikethrough**\n\n`~~text~~` - Cross out text");
    this.strikethroughButton.command = "vsc-markdown.insertStrikethrough";

    this.emptyBlockButton.text = "$(add)";
    this.emptyBlockButton.tooltip = new vscode.MarkdownString("**Insert Empty Block**\n\nAdd new paragraph");
    this.emptyBlockButton.command = "vsc-markdown.insertEmptyBlock";
  }

  updateCount(content: string) {
    this.countStatus.text = `${content.length} Words`;
  }

  show() {
    this.countStatus.show();
    this.h1Button.show();
    this.h2Button.show();
    this.h3Button.show();
    this.h4Button.show();
    this.h5Button.show();
    this.boldButton.show();
    this.italicButton.show();
    this.listButton.show();
    this.orderedListButton.show();
    this.linkButton.show();
    this.imageButton.show();
    this.codeBlockButton.show();
    this.inlineCodeButton.show();
    this.blockquoteButton.show();
    this.tableButton.show();
    this.strikethroughButton.show();
    this.emptyBlockButton.show();
  }

  hide() {
    this.countStatus.hide();
    this.h1Button.hide();
    this.h2Button.hide();
    this.h3Button.hide();
    this.h4Button.hide();
    this.h5Button.hide();
    this.boldButton.hide();
    this.italicButton.hide();
    this.listButton.hide();
    this.orderedListButton.hide();
    this.linkButton.hide();
    this.imageButton.hide();
    this.codeBlockButton.hide();
    this.inlineCodeButton.hide();
    this.blockquoteButton.hide();
    this.tableButton.hide();
    this.strikethroughButton.hide();
    this.emptyBlockButton.hide();
  }

  dispose() {
    this.countStatus.dispose();
    this.h1Button.dispose();
    this.h2Button.dispose();
    this.h3Button.dispose();
    this.h4Button.dispose();
    this.h5Button.dispose();
    this.boldButton.dispose();
    this.italicButton.dispose();
    this.listButton.dispose();
    this.orderedListButton.dispose();
    this.linkButton.dispose();
    this.imageButton.dispose();
    this.codeBlockButton.dispose();
    this.inlineCodeButton.dispose();
    this.blockquoteButton.dispose();
    this.tableButton.dispose();
    this.strikethroughButton.dispose();
    this.emptyBlockButton.dispose();
  }
}
