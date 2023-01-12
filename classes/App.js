import axios from 'axios';
import { showNotification } from '../modules/showNotification.js';

export default class App {
  constructor(root) {
    // 🚀 Props
    this.root = root;
    this.REGEX = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

    // 🚀 Render Skeleton
    this.root.innerHTML = `
      <h3 class='title'>YouTube to MP3 Converter</h3>
      <div class='content'>
        <form data-form=''>
          <label>
            <span class='label'></span>
            <input type='text' name='url' placeholder='Paste your youtube url here..'>
          </label>
          <button type='submit'>Submit</button>
        </form>
        <div class='result hide'>
          <div data-info=''></div>
        </div>
      </div>
    `;

    // 🚀 Query Selectors
    this.DOM = {
      form: document.querySelector('[data-form]'),
      link: document.querySelector('[data-link]'),
      info: document.querySelector('[data-info]'),
    };

    // 🚀 Events Listeners
    this.DOM.form.addEventListener('submit', this.onSubmit);
  }

  //===============================================
  // 🚀 Methods
  //===============================================
  /**
   * @function onSubmit - Form submit event handler
   * @param event
   */
  onSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const URL = Object.fromEntries(new FormData(form).entries()).url.trim();

    if (!this.REGEX.test(URL)) {
      showNotification('warning', 'Please enter validate URL.');
      return;
    }

    const match = URL.match(this.REGEX);

    if (match && match[7].length === 11) {
      this.fetchData(match[7]);
    }
  };

  //===============================================
  /**
   * @function fetchData - Fetch data from API
   * @param id
   * @returns {Promise<void>}
   */
  fetchData = async (id) => {
    try {
      this.DOM.form.querySelector('button').textContent = 'Loading...';

      const [info, mp3, formats] = await Promise.all([
        axios({
          method: 'GET',
          url: import.meta.env.VITE_RAPID_DOWNLOAD_URL,
          params: { id },
          headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY,
            'X-RapidAPI-Host': import.meta.env.VITE_RAPID_DOWNLOAD_HOST,
          },
        }),
        await axios({
          method: 'GET',
          url: import.meta.env.VITE_RAPID_INFO_URL,
          params: { id },
          headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY,
            'X-RapidAPI-Host': import.meta.env.VITE_RAPID_INFO_HOST,
          },
        }),
        await axios({
          method: 'GET',
          url: import.meta.env.VITE_RAPID_FORMATS_URL,
          params: { video: id },
          headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY,
            'X-RapidAPI-Host': import.meta.env.VITE_RAPID_FORMATS_HOST,
          },
        }),
      ]);

      const { title, thumb, length, author, status } = info.data;

      this.DOM.info.innerHTML = `
        <img src='${thumb}' alt='${title}'>
        <h3 class='h5'><a href='https://www.youtube.com/watch?v=${id}' target='_blank'>${title} - ${author} (${length})</a></h3>
        <ul>
          ${formats.data.AllFormats.map(({Type,Size,Link}) => `
            <li>
              <p><span>Format:</span>${Type}</p>
              <p><span>Size:</span>${(Size / (1024*1024)).toFixed(2)}MB</p>
              <a class='button' href='${Link}' target='_blank'>Download</a>
            </li>
          `).join('')}
        </ul>
      `;
      this.setDefault();
    } catch (e) {
      showNotification('danger', 'Something went wrong, open developer console.');
      console.log(e);
      this.setDefault();
    }
  };

  //===============================================
  /**
   * @function setDefault - Set default values
   * @param type
   */
  setDefault = () => {
    document.querySelector('.result').classList.remove('hide');
    this.DOM.form.querySelector('button').textContent = 'Submit';
  };
}
