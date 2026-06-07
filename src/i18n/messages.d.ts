declare module "./messages/*.js" {
  const messages: Record<string, string>;
  export default messages;
}

declare module "./messages/en.js" {
  const messages: Record<string, string>;
  export default messages;
}
