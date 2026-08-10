const axios = require('axios')
const cheerio = require('cheerio')

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.mediafire.com/',
  'Upgrade-Insecure-Requests': '1'
}

async function mediafiredl(url) {
  const res = await axios.get(url, {headers, maxRedirects: 5 })
  const $ = cheerio.load(res.data)
  const download = $('#download_link > a.input.popsok').attr('href') || null
  const filename = $('.dl-btn-label').first().text().trim() || null
  const filesize = $('#download_link > a.input.popsok')
    .text()
    .match(/\(([^)]+)\)/)?.[1] || null
  const filetype = $('.dl-info .filetype span')
    .first()
    .text()
    .trim() || null
  const uploaded = $('.details li')
    .eq(1)
    .find('span')
    .text()
    .trim() || null
  return {
    filename,
    filetype,
    filesize,
    uploaded,
    download
  }
}

mediafiredl('https://www.mediafire.com/file/ktzstpy3d8nturk/Kyzo+Base.zip/file')
.then(console.log)
.catch(console.error)
/*
{
  filename: 'Kyzo Base',
  filetype: 'Compressed Archive',
  filesize: '19.41KB',
  uploaded: '2026-02-02 09:23:30',
  download: 'https://download1320.mediafire.com/0wh1crjyc2vg8Fl_mTxL_9IVjmti8nqNo-lH635-uTl_I8jVJz_zj-mooWuKaExJGR4YoQ2-_l2BAc07dZ-ZAYZyrYYeW1w_cAfh0_Sw6NRRhUZOHE3SVe5mkZrX-XW5Uf7jzMVJtFieqAE0_A9CLdoyrBbYgstjyTcyWZsZ_kQT/ktzstpy3d8nturk/Kyzo+Base.zip'
}
*/