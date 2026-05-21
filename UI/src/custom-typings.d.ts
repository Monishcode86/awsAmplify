declare module '@aws-amplify/data' {
  export function generateClient(config?: any): any;
  export type Client<T = any> = any;
  export default generateClient;
}

declare module '@aws-amplify/storage' {
  export function getUrl(options: any): Promise<any>;
  export function uploadData(options: any): Promise<any>;
}
