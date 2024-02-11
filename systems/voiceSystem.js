const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
const client = require('../utils/discordClient.js');
const EventEmitter = require('events');
const prism = require('prism-media');
const Record = require('../models/recordModel.js');
const GridFSBucket = require('mongodb').GridFSBucket;
const mongoose = require('mongoose');
const path = require('path');
const processData = require('../utils/processData.js');

// Configure gridfs
let bucket = GridFSBucket;
mongoose.connection.on('connected', () => {
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'records',
  });
});

class Player extends EventEmitter {
  constructor(channelId) {
    super();
    // Join voice channel
    client.guilds.fetch(process.env.GUILD).then((guild) => {
      this.guild = guild;
      this.connection = joinVoiceChannel({
        channelId: channelId,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      // Create player
      this.player = createAudioPlayer();

      // Create subscribtion
      this.sub = this.connection.subscribe(this.player);

      this.play(path.join(__dirname, 'voices/recordwarn.mp3'));
      this.emit('ready');

      processData.set('player', this);
      return this;
    });
  }

  async createUploadStream(filename, usersDiscordId = undefined) {
    const record = await Record.create({
      filename,
      usersDiscordId,
    });
    this.emit('create-upload-stream');
    return { stream: bucket.openUploadStream(filename), record };
  }

  async createDownloadStream(fileId) {
    const record = await Record.findById(fileId);
    this.emit('create-download-stream');
    return { stream: bucket.openDownloadStreamByName(record.filename), record };
  }

  setAudioResource(audioPath) {
    this.audioResource = createAudioResource(audioPath);
    this.emit('set-audio-resource');
    return this;
  }

  play(audioPath) {
    const audioResource = audioPath
      ? createAudioResource(audioPath)
      : this.audioResource;
    this.player.play(audioResource);
    this.emit('player.play');
    return this;
  }

  stop() {
    this.player.stop();
    this.emit('player.stop');
    return this;
  }

  pause() {
    this.player.pause();
    this.emit('player.pause');
    return this;
  }

  start() {
    this.player.unpause();
    this.emit('player.unpause');
    return this;
  }

  leave() {
    console.log(this.connection.state.status);
    if (!this.connection.state.status !== VoiceConnectionStatus.Destroyed)
      return;
    this.connection.destroy();
    this.emit('connection.destroy');
    return this;
  }

  createListeningStream(usersIds, writeStream, end) {
    const receiver = this.connection.receiver;
    this.opusStream = [];

    usersIds.forEach((userId) => {
      const opusStream = receiver.subscribe(userId, {
        end,
      });

      const opusDecoder = new prism.opus.Decoder({
        frameSize: 960,
        channels: 2,
        rate: 48000,
      });
      this.opusStream = opusStream;

      opusStream.pipe(opusDecoder).pipe(writeStream);
    });
    this.emit('create-listining-stream');
    return this;
  }

  stopListining(after = 0) {
    setTimeout(() => this.opusStream?.end(), after);
    this.emit('stop-listining-stream');
    return this;
  }
}

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.member.id !== process.env.BOT_ID) return;
});

module.exports = Player;
