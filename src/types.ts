export interface Album {
  id: string,
  title: string,
  coverPhotoBaseUrl: string,
  itemCount: number,
  appCreated: boolean,
  productUrl: string
}

export interface Photo {
  id: string,
  title: string,
  metadata: {
    width: number,
    height: number,
    creationTime: Date,
  },
  albumIds: string[],
  mimeType: string,
  productUrl: string
}

export interface PhotoFilter {
    title: RegExp | string,
    albums: string[],
    creationTime: {
        after: Date,
        before: Date
    }
}

export interface Mail {
  from: string,
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  bodyText: string,
  bodyHtml: string,
  timestamp: Date,
  raw: string
}

interface GmailHeader {
  name: string,
  value: string
}

interface GmailMessagePartBody {
  attachmentId: string,
  size: number,
  data: string
}

export interface GmailMessagePart {
  partId: string,
  mimeType: string,
  filename: string,
  headers: GmailHeader[],
  body: GmailMessagePartBody,
  parts: GmailMessagePart[]
}

export interface GmailMessage {
  "id": string,
  "threadId": string,
  "labelIds": string[],
  "snippet": string,
  "historyId": string,
  "internalDate": string,
  "payload": GmailMessagePart,
  "sizeEstimate": number,
  "raw": string
}

type NotifData = Notif['type'] extends 'mail' ? GmailMessage : Record<string, any>;
export interface Notif {
  id: string,
  title: string,
  message: string,
  type: 'error' | 'mail' | 'erp_notice',
  data: NotifData,
  timestamp: string
}
