const axios = require('axios');
const cheerio = require('cheerio');
const baseUrl = 'http://dnd5e.wikidot.com';

async function getAllSpellUrls() {
    const mainSpellsUrl = `${baseUrl}/spells`;
    console.log(`🚀 Buscando todas as URLs de magias de: ${mainSpellsUrl}`);
    try {
        const { data } = await axios.get(mainSpellsUrl);
        const $ = cheerio.load(data);
        const allSpells = new Set();
        const spellLinkSelector = 'table.wiki-content-table td:first-child a';
        $(spellLinkSelector).each((i, element) => {
            const partialUrl = $(element).attr('href');
            if (partialUrl && partialUrl.startsWith('/spell:')) {
                allSpells.add(baseUrl + partialUrl);
            }
        });
        return Array.from(allSpells);
    } catch (error) {
        console.error("❌ Erro ao buscar as URLs de magias:", error.message);
        return [];
    }
}

async function getAllLineageUrls() {
    const mainLineagesUrl = `${baseUrl}/lineage`;
    console.log(`🚀 Buscando todas as URLs de linhagens de: ${mainLineagesUrl}`);
    try {
        const { data } = await axios.get(mainLineagesUrl);
        const $ = cheerio.load(data);
        const allLineageUrls = new Set();
        const linkSelector = 'div#page-content table.wiki-content-table td a';
        $(linkSelector).each((_, element) => {
            const partialUrl = $(element).attr('href');
            if (partialUrl && partialUrl.startsWith('/lineage:')) {
                allLineageUrls.add(baseUrl + partialUrl);
            }
        });
        return Array.from(allLineageUrls);
    } catch (error) {
        console.error("❌ Erro ao buscar as URLs de linhagens:", error.message);
        return [];
    }
}

async function getClassAndSubclassUrls() {
    console.log("🚀 Buscando URLs de classes e subclasses da página principal...");
    const { data: html } = await axios.get(baseUrl);
    const $ = cheerio.load(html);
    const classesData = [];

    const targetClasses = ['Artificer', 'Barbarian', 'Bard', 'Blood Hunter', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

    $('h1 a').each((_, el) => {
        const linkElement = $(el);
        const className = linkElement.text().trim();

        if (targetClasses.some(target => className.includes(target))) {
            const classBlock = linkElement.closest('.feature');
            const classUrl = baseUrl + linkElement.attr('href');

            const classInfo = {
                name: className,
                url: classUrl,
                subclasses: []
            };

            classBlock.find('h6').each((_, h6) => {
                const categoryTitle = $(h6).text().trim();
                const subclassLinks = $(h6).next('p').find('a');

                if (subclassLinks.length > 0) {
                    subclassLinks.each((_, link) => {
                        classInfo.subclasses.push({
                            name: $(link).text().trim(),
                            url: baseUrl + $(link).attr('href'),
                            category: categoryTitle,
                        });
                    });
                }
            });
            classesData.push(classInfo);
        }
    });

    console.log(`✅ Mapa de ${classesData.length} classes e suas subclasses criado.`);
    return classesData;
}


module.exports = {
    getAllSpellUrls,
    getAllLineageUrls,
    getClassAndSubclassUrls
};