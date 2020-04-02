
const key = 'altplayer';

const storage = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
      return {};
    }
  },
  set: (data) => {
    return localStorage.setItem(key, JSON.stringify(data));
  },
};

export default storage;
