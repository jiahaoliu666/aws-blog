const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
  webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/line/webhook`,
};

const LINE_MESSAGE_MAX_LENGTH = 2000;
const LINE_RETRY_COUNT = 3;
const LINE_RETRY_DELAY = 1000; // milliseconds

module.exports = {
  lineConfig,
  LINE_MESSAGE_MAX_LENGTH,
  LINE_RETRY_COUNT,
  LINE_RETRY_DELAY,
};
