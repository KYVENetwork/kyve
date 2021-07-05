import chalk from "chalk";
import fecha from "fecha";

type Level = "error" | "warn" | "info" | "debug";

export default class Log {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public error(message: string) {
    console.log(this.formatMessage(message, "error"));
  }

  public warn(message: string) {
    console.log(this.formatMessage(message, "warn"));
  }

  public info(message: string) {
    console.log(this.formatMessage(message, "info"));
  }

  public debug(message: string) {
    console.log(this.formatMessage(message, "debug"));
  }

  private formatMessage(message: string, level: Level) {
    const formattedName = this.getFormattedName();
    const formattedLevel = this.getFormattedLevel(level);
    const formattedTiemstamp = this.getFormattedTimestamp();

    return `${formattedTiemstamp} ${formattedLevel} [${formattedName}]:  ${message}`;
  }

  private getFormattedName() {
    return chalk.bold.whiteBright(this.name);
  }

  private getFormattedLevel(level: Level) {
    switch (level) {
      case "error":
        return chalk.bold.redBright(level);
      case "warn":
        return chalk.bold.yellowBright(level);
      case "info":
        return chalk.bold.greenBright(level);
      case "debug":
        return chalk.bold.cyanBright(level);
    }
  }

  private getFormattedTimestamp() {
    const timestamp = fecha.format(new Date(), "HH:mm:ss");
    return chalk.grey(timestamp);
  }
}
