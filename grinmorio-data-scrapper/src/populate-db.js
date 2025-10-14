require('dotenv').config();

const { connectToDatabase, getDb } = require('./database');
const { getAllSpellUrls, getAllLineageUrls, getClassAndSubclassUrls } = require('./crawler');
const { extractSpellData, extractLineageData, extractClassDetails, extractSubclassDetails } = require('./scraper');

async function populateSpells() {
    console.log("Iniciando processo de população de MAGIAS...");
    const db = getDb();
    const collection = db.collection('spells');
    console.log("🚀 Fase 1: Buscando URLs de magias...");
    const urls = await getAllSpellUrls();
    console.log(`✅ Fase 1 Concluída: ${urls.length} URLs encontradas.`);
    console.log("\n🚀 Fase 2: Raspando dados e salvando no banco...");
    let successCount = 0;
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`   -> Processando ${i + 1}/${urls.length}: ${url.split('/').pop()}`);
        const data = await extractSpellData(url);
        if (data) {
            await collection.updateOne({ url: data.url }, { $set: data }, { upsert: true });
            successCount++;
        }
    }
    console.log(`✅ Fase 2 Concluída: ${successCount} magias salvas/atualizadas.`);
}

async function populateLineages() {
    console.log("Iniciando processo de população de LINHAGENS...");
    const db = getDb();
    const collection = db.collection('lineages');
    console.log("🚀 Fase 1: Buscando URLs de linhagens...");
    const urls = await getAllLineageUrls();
    console.log(`✅ Fase 1 Concluída: ${urls.length} URLs encontradas.`);
    console.log("\n🚀 Fase 2: Raspando dados e salvando no banco...");
    let successCount = 0;
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`   -> Processando ${i + 1}/${urls.length}: ${url.split('/').pop()}`);
        const data = await extractLineageData(url);
        if (data) {
            await collection.updateOne({ url: data.url }, { $set: data }, { upsert: true });
            successCount++;
        }
    }
    console.log(`✅ Fase 2 Concluída: ${successCount} linhagens salvas/atualizadas.`);
}

async function populateAllClassData() {
    console.log("Iniciando processo COMPLETO de população de Classes e Subclasses...");
    const db = getDb();
    const classesCollection = db.collection('classes');

    // 1. Crawler busca o mapa de todas as URLs necessárias de uma vez.
    const classUrlMap = await getClassAndSubclassUrls();

    for (let i = 0; i < classUrlMap.length; i++) {
        const classInfo = classUrlMap[i]; // Contém { name, url, subclasses: [{ name, url, category }] }
        console.log(`\n--- [${i + 1}/${classUrlMap.length}] Processando Classe: ${classInfo.name} ---`);

        // 2. Scraper busca os detalhes da classe principal.
        const classDetails = await extractClassDetails(classInfo.url);
        if (!classDetails) {
            console.log(`   -> Falha ao buscar detalhes da classe principal. Pulando.`);
            continue;
        }

        // 3. Loop para buscar os detalhes de cada subclasse e ENRIQUECER o objeto.
        console.log(`   -> Encontradas ${classInfo.subclasses.length} subclasses para detalhar...`);
        for (const subclassInfo of classInfo.subclasses) {
            console.log(`      -> Extraindo: ${subclassInfo.name}`);
            const subclassDetails = await extractSubclassDetails(subclassInfo.url);

            if (subclassDetails) {
                // A MÁGICA ACONTECE AQUI: Adicionamos o objeto 'details' diretamente
                // ao objeto da subclasse que já temos na lista.
                subclassInfo.details = subclassDetails;
            }
        }

        // 4. Agrupa as subclasses detalhadas por categoria para o documento final.
        const subclassesByCategory = classInfo.subclasses.reduce((acc, sub) => {
            const category = acc.find(c => c.category === sub.category);
            // Remove a propriedade 'category' do objeto da subclasse, pois já está no grupo.
            const { category: cat, ...restOfSub } = sub;
            if (category) {
                category.list.push(restOfSub);
            } else {
                acc.push({ category: sub.category, list: [restOfSub] });
            }
            return acc;
        }, []);

        // 5. Monta e salva o documento final e completo da classe.
        const completeClassDocument = {
            name: classInfo.name,
            url: classInfo.url,
            description: classDetails.description,
            progression_table: classDetails.progression_table,
            features: classDetails.features,
            subclasses: subclassesByCategory, // Agora contém a lista de subclasses com todos os detalhes
            updated_at: new Date()
        };

        await classesCollection.updateOne(
            { name: completeClassDocument.name },
            { $set: completeClassDocument },
            { upsert: true }
        );
        console.log(`   -> ✅ Documento completo da classe ${classInfo.name} salvo no banco.`);
    }
}


async function main() {
    const target = process.argv[2];
    if (!target) {
        console.error("❌ Erro: Você precisa especificar o que popular.");
        console.log("Uso: node src/populate-db.js [spells|lineages|classes]"); // Simplificado
        process.exit(1);
    }
    await connectToDatabase();
    switch (target) {
        case 'spells': await populateSpells(); break;
        case 'lineages': await populateLineages(); break;
        case 'classes': await populateAllClassData(); break; // O único comando para classes
        default: console.error(`❌ Alvo desconhecido: "${target}".`); break;
    }
    console.log("\nProcesso finalizado!");
    process.exit(0);
}

main();