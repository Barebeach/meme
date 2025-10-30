import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data.json');

class Storage {
  constructor() {
    this.data = null;
  }

  async init() {
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      this.data = JSON.parse(content);
      console.log('📊 Storage initialized');
    } catch (error) {
      console.error('Failed to load data:', error);
      this.data = {
        broadcastState: {
          isLive: false,
          countdown: null,
          episodeStarted: false,
          currentEpisode: null,
          startTime: null
        },
        schedule: [],
        videos: {
          hosts: {},
          guests: {}
        },
        episodes: []
      };
      await this.save();
    }
  }

  async save() {
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  getBroadcastState() {
    return this.data.broadcastState;
  }

  async setBroadcastState(state) {
    this.data.broadcastState = { ...this.data.broadcastState, ...state };
    await this.save();
  }

  getSchedule() {
    return this.data.schedule;
  }

  async addScheduleEntry(entry) {
    this.data.schedule.push({
      id: Date.now().toString(),
      ...entry,
      createdAt: new Date().toISOString()
    });
    await this.save();
    return this.data.schedule[this.data.schedule.length - 1];
  }

  async updateScheduleEntry(id, updates) {
    const index = this.data.schedule.findIndex(e => e.id === id);
    if (index !== -1) {
      this.data.schedule[index] = { ...this.data.schedule[index], ...updates };
      await this.save();
      return this.data.schedule[index];
    }
    return null;
  }

  async deleteScheduleEntry(id) {
    this.data.schedule = this.data.schedule.filter(e => e.id !== id);
    await this.save();
  }

  getVideos(type = null) {
    if (type) {
      return this.data.videos[type] || {};
    }
    return this.data.videos;
  }

  async setVideo(type, characterId, emotion, filepath) {
    if (!this.data.videos[type]) {
      this.data.videos[type] = {};
    }
    if (!this.data.videos[type][characterId]) {
      this.data.videos[type][characterId] = {};
    }
    this.data.videos[type][characterId][emotion] = filepath;
    await this.save();
  }

  async deleteVideo(type, characterId, emotion) {
    if (this.data.videos[type]?.[characterId]?.[emotion]) {
      delete this.data.videos[type][characterId][emotion];
      await this.save();
    }
  }

  getVideoPath(type, characterId, emotion) {
    return this.data.videos[type]?.[characterId]?.[emotion] || null;
  }

  getEpisodes() {
    return this.data.episodes;
  }

  async addEpisode(episode) {
    this.data.episodes.unshift({
      id: Date.now().toString(),
      ...episode,
      createdAt: new Date().toISOString()
    });
    await this.save();
    return this.data.episodes[0];
  }

  async updateEpisode(id, updates) {
    const index = this.data.episodes.findIndex(e => e.id === id);
    if (index !== -1) {
      this.data.episodes[index] = { ...this.data.episodes[index], ...updates };
      await this.save();
      return this.data.episodes[index];
    }
    return null;
  }

  async deleteEpisode(id) {
    this.data.episodes = this.data.episodes.filter(e => e.id !== id);
    await this.save();
  }
}

const storage = new Storage();
export default storage;
