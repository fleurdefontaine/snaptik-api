const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

class Resource {
  constructor(url, index) {
    this.index = index;
    this.url = url;
  }

  toJSON() {
    return this.url;
  }

  download(config = {}) {
    return axios({
      url: this.url,
      responseType: 'stream',
      ...config
    });
  }
}

class SnapTikClient {
  constructor(config = {}) {
    this.config = {
      baseURL: 'https://dev.snaptik.app',
      ...config,
    };
    this.axios = axios.create(this.config);
  }

  async get_token() {
    const { data } = await this.axios.get('/');
    const $ = cheerio.load(data);
    return $('input[name="token"]').val();
  }

  async get_script(url) {
    const form = new FormData();
    const token = await this.get_token();
    form.append('token', token);
    form.append('url', url);
    const { data } = await this.axios.post('/abc2.php', form);
    return data;
  }

  async eval_script(script1) {
    const script2 = await new Promise(resolve => Function('eval', script1)(resolve));
    return new Promise((resolve, reject) => {
      let html = '';
      const mockObjects = {
        $: () => ({
          remove() {},
          style: { display: '' },
          get innerHTML() { return html; },
          set innerHTML(t) { html = t; }
        }),
        app: { showAlert: reject },
        document: { getElementById: () => ({ src: '' }) },
        fetch: a => {
          resolve({ html, oembed_url: a });
          return { json: () => ({ thumbnail_url: '' }) };
        },
        gtag: () => 0,
        Math: { round: () => 0 },
        XMLHttpRequest: function() {
          return { open() {}, send() {} };
        },
        window: { location: { hostname: 'snaptik.app' } }
      };

      Function(...Object.keys(mockObjects), script2)(...Object.values(mockObjects));
    });
  }

  async get_hd_video(token) {
    const { data: { error, url } } = await this.axios.get(`/getHdLink.php?token=${token}`);
    if (error) throw new Error(error);
    return url;
  }

  async parse_html(html) {
    const $ = cheerio.load(html);
    const is_video = !$('div.render-wrapper').length;

    if (is_video) {
      const hd_token = $('div.video-links > button[data-tokenhd]').data('tokenhd');
      const hd_url = new URL(await this.get_hd_video(hd_token));
      const token = hd_url.searchParams.get('token');
      const { url } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

      return {
        type: 'video',
        data: {
          sources: [
            url,
            hd_url.href,
            ...$('div.video-links > a:not(a[href="/"])').map((_, elem) => $(elem).attr('href')).get()
              .map(x => x.startsWith('/') ? this.config.baseURL + x : x)
          ].map((url, index) => new Resource(url, index))
        }
      };
    } else {
      const photos = $('div.columns > div.column > div.photo').map((_, elem) => ({
        sources: [
          $(elem).find('img[alt="Photo"]').attr('src'),
          $(elem).find('a[data-event="download_albumPhoto_photo"]').attr('href')
        ].map((url, index) => new Resource(url, index))
      })).get();

      return photos.length === 1
        ? { type: 'photo', data: { sources: photos[0].sources } }
        : { type: 'slideshow', data: { photos } };
    }
  }

  async process(url) {
    const script = await this.get_script(url);
    const { html, oembed_url } = await this.eval_script(script);
    const result = await this.parse_html(html);
    result.data.oembed_url = oembed_url;
    result.url = url;
    
    if (result.data.sources) {
      result.data.sources = result.data.sources.map(resource => resource.url);
    }
    
    return result;
  }
}

module.exports = SnapTikClient;