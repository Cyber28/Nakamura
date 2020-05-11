declare module 'nakamura' {
  import EventEmitter from 'eventemitter3';

  namespace Nakamura {
    export namespace Constants {
      export const unrecoverableCloseCodes: number[];
      export const GATEWAY_URL: string;
      export const API_URL: string;
      export interface GatewayOpcodes {
        [x: string]: number;
      }
    }

    export class Shard extends EventEmitter<any> {
      private constructor(client: Nakamura.Client);
      public guilds: Map<string, any>;
    }

    export class Client extends EventEmitter<any> {
      constructor(token: string, options?: { debug: boolean });
      public user: any; // Entity types are not implemented
      public connect(): void;
      public createMessage(channelID: string, content: string | object): Promise<any>;
      public leaveGuild(guildID: string): Promise<any>;
      public getGatewayBot(): Promise<any>;
      public getMessages(channelID: string, limit: number): Promise<any[]>;
      public addGuildMemberRole(guildID: string, memberID: string, roleID: string): Promise<any>;
      public removeGuildMemberRole(guildID: string, memberID: string, roleID: string): Promise<any>;
      public setAllStatus(data: any): void;
    }
  }

  export = Nakamura;
}