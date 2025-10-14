const axios = require('axios');
const cheerio = require('cheerio');

async function extractSpellData(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const content = $('#page-content');
        const name = $('.page-title').text().trim();
        const spellData = { name, url, source: '', level_school: '', casting_time: '', range: '', components: '', duration: '', description: '', at_higher_levels: '', spell_lists: [], updated_at: new Date() };
        const paragraphs = content.find('p');
        spellData.source = $(paragraphs[0]).text().replace('Source:', '').trim();
        spellData.level_school = $(paragraphs[1]).text().trim();
        const infoBlockHTML = $(paragraphs[2]).html();
        if (infoBlockHTML) {
            const infoLines = infoBlockHTML.split('<br>').map(line => cheerio.load(line).text().trim());
            infoLines.forEach(line => {
                if (line.toLowerCase().startsWith('casting time:')) spellData.casting_time = line.replace(/Casting Time:/i, '').trim();
                else if (line.toLowerCase().startsWith('range:')) spellData.range = line.replace(/Range:/i, '').trim();
                else if (line.toLowerCase().startsWith('components:')) spellData.components = line.replace(/Components:/i, '').trim();
                else if (line.toLowerCase().startsWith('duration:')) spellData.duration = line.replace(/Duration:/i, '').trim();
            });
        }
        spellData.description = $(paragraphs[3]).html() || '';
        for (let i = 4; i < paragraphs.length; i++) {
            const pText = $(paragraphs[i]).text().trim();
            const pHTML = $(paragraphs[i]).html() || '';
            if (pText.toLowerCase().startsWith('at higher levels.')) {
                spellData.at_higher_levels = pHTML.replace(/<strong><em>At Higher Levels.<\/em><\/strong>/i, '').trim();
            } else if (pText.toLowerCase().startsWith('spell lists.')) {
                spellData.spell_lists = $(paragraphs[i]).find('a').map((_, el) => $(el).text()).get();
            }
        }
        return spellData;
    } catch (error) {
        console.error(`❌ Erro ao raspar dados de magia de ${url}: ${error.message}`);
        return null;
    }
}

async function extractLineageData(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const pageTitle = $('.page-title').text().trim();
    const content = $('#page-content');
    
    const lineageData = {
      name: pageTitle,
      url: url,
      sections: [],
      updated_at: new Date(),
    };

    const sectionTitles = content.find('h1');

    if (sectionTitles.length === 0) {
      lineageData.sections.push({
        title: 'General',
        content_html: content.html(),
      });
    } else {
      sectionTitles.each((index, el) => {
        const title = $(el).text().trim();
        const sectionContentHtml = $(el).nextUntil('h1').map((i, elem) => $(elem).html()).get().join('');

        lineageData.sections.push({
          title: title,
          content_html: sectionContentHtml,
        });
      });
    }

    return lineageData;
  } catch (error) {
    console.error(`❌ Erro ao raspar dados de linhagem de ${url}: ${error.message}`);
    return null;
  }
}

async function extractClassDetails(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const content = $('#page-content');
        const classDetails = {
            description: content.find('p').first().text().trim(),
            progression_table: [],
            features: {}
        };

        const table = content.find('table.wiki-content-table').first();
        const headers = [];
        table.find('tr').first().find('th').each((i, el) => headers.push($(el).text().trim().toLowerCase().replace(/ /g, '_')));
        table.find('tr').slice(1).each((i, row) => {
            const levelData = {};
            $(row).find('td').each((j, cell) => { levelData[headers[j]] = $(cell).text().trim(); });
            classDetails.progression_table.push(levelData);
        });

        const featuresHeader = content.find('h1:contains("Class Features")');
        if (featuresHeader.length > 0) {
            featuresHeader.nextAll('h3, h5').each((_, el) => {
                const featureTitle = $(el).text().trim();
                const featureContentHtml = $(el).nextUntil('h1, h3, h5').map((_, elem) => $.html(elem)).get().join('');
                classDetails.features[featureTitle] = featureContentHtml;
            });
        }
        return classDetails;
    } catch (error) {
        console.error(`❌ Erro ao extrair detalhes da classe de ${url}: ${error.message}`);
        return null;
    }
}

/**
 * Extrai os detalhes de uma página de SUBCLASSE.
 */
async function extractSubclassDetails(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const content = $('#page-content');
    const subclassDetails = {
      name: $('.page-title').text().trim(),
      description: content.find('p').first().text().trim(),
      features: {}
    };

    content.find('h3, h5').each((_, el) => {
        const featureTitle = $(el).text().trim();
        const featureContentHtml = $(el).nextUntil('h1, h3, h5').map((_, elem) => $.html(elem)).get().join('');
        if (featureTitle && featureContentHtml) {
            subclassDetails.features[featureTitle] = featureContentHtml;
        }
    });
    return subclassDetails;
  } catch (error) {
    console.error(`❌ Erro ao extrair detalhes da subclasse de ${url}: ${error.message}`);
    return null;
  }
}

module.exports = { 
    extractSpellData, 
    extractLineageData, 
    extractClassDetails, 
    extractSubclassDetails 
};