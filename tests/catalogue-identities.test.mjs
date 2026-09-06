import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {canonicalModelId, MODEL_ALIASES} from '../functions/_lib/model-identity.js';
import {validateCatalogState, validateFavorite} from '../functions/_lib/model-workspace.js';
import {assertCatalogueIntegrity} from '../scripts/catalogue-integrity.js';
import ranking from '../js/model-ranking.js';

const root = resolve(import.meta.dirname, '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
const oldId = 'mistral-small3.2-24b';
const canonical = 'mistral-small-3.2-24b';
const context = vm.createContext({});
vm.runInContext(read('js/data.js') + ';this.data=APP_DATA;', context);
const data = context.data;
const migration = read('migrations/0010_canonical_model_identities.sql');

function database() {
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys=ON;');
    for (const file of ['0001_accounts_and_machines.sql', '0002_model_workspace.sql', '0003_model_test_bench.sql', '0004_model_ratings.sql', '0009_saved_plan_selection.sql']) db.exec(read(`migrations/${file}`));
    return db;
}
function seedUser(db, user = 'user1', machine = 'machine1') {
    db.prepare('INSERT OR IGNORE INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,1,?,?)')
        .run(user, user, `${user}@example.test`, '2026-01-01', '2026-01-01');
    db.prepare(`INSERT INTO machines (id,user_id,name,platform,accelerator,ram_gb,created_at,updated_at,selected_model_id)
        VALUES (?,?,?,'macos','apple-silicon',32,'2026-01-01','2026-09-01',?)`).run(machine, user, machine, oldId);
}
function seedFavorite(db, overrides = {}) {
    const row = {user_id:'user1',machine_id:'machine1',model_id:oldId,status:'installed',quantization:'Q4_K_M',
        test_verdict:'works',measured_tps:18.5,notes:'Local test',last_tested_at:'2026-08-01',created_at:'2026-07-01',updated_at:'2026-08-01',...overrides};
    const columns = Object.keys(row);
    db.prepare(`INSERT INTO model_favorites (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`).run(...Object.values(row));
    return row;
}
function migrate(db) {
    db.exec('BEGIN;');
    try { db.exec(migration); db.exec('COMMIT;'); } catch (error) { db.exec('ROLLBACK;'); throw error; }
}
const rows = (db, sql) => db.prepare(sql).all().map(row => ({...row}));

test('catalogue has one record per identity and a matching API alias', () => {
    assertCatalogueIntegrity(data);
    assert.equal(data.models.length, 234);
    assert.deepEqual(JSON.parse(JSON.stringify(data.modelAliases)), MODEL_ALIASES);
    assert.equal(canonicalModelId(oldId), canonical);
    assert.equal(canonicalModelId('granite3.3-8b'), 'granite3.3-8b');
    assert.equal(data.models.some(model => model.id === oldId), false);
    const mistral = data.models.find(model => model.id === canonical);
    assert.equal(mistral.recommended_quant, 'Q4_K_M');
    assert.equal(mistral.size_gb, 14.3);
    assert.deepEqual(Array.from(mistral.download_variants, variant => [variant.quant, variant.size_gb]), [['Q4_K_M',14.3],['Q5_K_M',16.8]]);
    assert.equal(data.models.find(model => model.id === 'granite3.3-8b').released, '2025-04');
    assert.throws(() => assertCatalogueIntegrity({...data, models:[...data.models, mistral]}), /Duplicate.*ID/);
    assert.throws(() => assertCatalogueIntegrity({...data, models:[...data.models, {...mistral,id:'another-spelling'}]}), /Duplicate.*identity/);
});

test('ranking and model page use the same consolidated record and explicit formats', () => {
    const machine = {platform:'macos',accelerator:'apple-silicon',ramGb:128,useCase:'coding',context:'8k'};
    const ranked = ranking.rankModels(machine, {}, data.models, {includeTight:true,limit:0}).allCompatible;
    for (const id of [canonical,'granite3.3-8b','aya-expanse-32b','command-a-111b']) {
        const catalogModel = data.models.find(model => model.id === id);
        const recommendation = ranked.find(model => model.id === id);
        assert.ok(recommendation, id);
        assert.equal(recommendation.size_gb, catalogModel.size_gb, id);
        assert.equal(recommendation.min_ram, catalogModel.min_ram, id);
        assert.equal(recommendation.benchmarks.coding, catalogModel.benchmarks.coding, id);
    }
    const source = read('scripts/generate-model-pages.js');
    const renderOnly = source.slice(0, source.indexOf('const APP_DATA = loadAppData();'));
    const renderContext = vm.createContext({require:createRequire(resolve(root,'scripts/generate-model-pages.js')),__dirname:resolve(root,'scripts')});
    vm.runInContext(renderOnly + `\nconst APP_DATA=loadAppData(); const m=APP_DATA.models.find(m=>m.id==='${canonical}'); this.html=modelPage(m,{},APP_DATA.models);`, renderContext);
    assert.match(renderContext.html, /Download formats for this model/);
    assert.match(renderContext.html, /Q4_K_M\.gguf/);
    assert.match(renderContext.html, /Q5_K_M\.gguf/);
    assert.match(renderContext.html, /16\.8 GB/);
    assert.doesNotMatch(renderContext.html, /\/models\/mistral-small3\.2-24b/);
});

test('alias-only favorites migrate without changing tests, notes or timestamps; machine and catalogue references follow', () => {
    const db = database();
    seedUser(db);
    const original = seedFavorite(db);
    const unrelated = seedFavorite(db, {model_id:'qwen3-14b',notes:'Unrelated'});
    db.prepare('INSERT INTO user_catalog_state VALUES (?,?,?)').run('user1',JSON.stringify([oldId,'qwen3-14b',canonical]),'2026-08-01');
    migrate(db);
    assert.deepEqual(rows(db, `SELECT * FROM model_favorites WHERE model_id='${canonical}'`)[0], {...original,model_id:canonical});
    assert.deepEqual(rows(db, "SELECT * FROM model_favorites WHERE model_id='qwen3-14b'")[0], unrelated);
    assert.equal(db.prepare('SELECT selected_model_id FROM machines').get().selected_model_id, canonical);
    assert.deepEqual(JSON.parse(db.prepare('SELECT known_model_ids FROM user_catalog_state').get().known_model_ids), [canonical,'qwen3-14b']);
    const archive = rows(db,'SELECT * FROM model_identity_merge_archive ORDER BY entity');
    assert.deepEqual(JSON.parse(archive.find(row => row.entity==='favorite').payload), original);
    migrate(db);
    assert.deepEqual(rows(db,'SELECT * FROM model_identity_merge_archive ORDER BY entity'), archive, 'repeat migration must not replace the original evidence');
    assert.equal(db.prepare('SELECT COUNT(*) AS total FROM model_favorites').get().total, 2);
    assert.deepEqual(rows(db,'PRAGMA foreign_key_check'), []);
    db.close();
});

test('conflicting favorites retain highest progress and its quant/test pair while preserving both full test logs', () => {
    const db = database();
    seedUser(db);
    const first = seedFavorite(db, {status:'installed',notes:'A'.repeat(800),test_verdict:'limited',measured_tps:12});
    const second = seedFavorite(db, {model_id:canonical,status:'saved',quantization:'Q5_K_M',test_verdict:'failed',measured_tps:1,
        notes:'B'.repeat(800),last_tested_at:'2026-09-01',created_at:'2026-08-01',updated_at:'2026-09-01'});
    migrate(db);
    const merged = rows(db,'SELECT * FROM model_favorites')[0];
    assert.equal(merged.status,'installed');
    assert.equal(merged.quantization,'Q4_K_M');
    assert.equal(merged.test_verdict,'limited');
    assert.equal(merged.measured_tps,12);
    assert.equal(merged.last_tested_at,first.last_tested_at);
    assert.ok(merged.notes.includes(first.notes));
    assert.ok(merged.notes.includes(second.notes));
    assert.match(merged.notes,/Q5_K_M.*saved.*failed.*1\.0? tokens\/s/);
    assert.ok(merged.notes.length > 1600 && merged.notes.length < 2400);
    assert.equal(validateFavorite({machineId:'machine1',notes:merged.notes},canonical).ok,true, 'merged notes remain editable');
    assert.equal(merged.created_at,first.created_at);
    assert.equal(merged.updated_at,second.updated_at);
    const archived = rows(db,"SELECT payload FROM model_identity_merge_archive WHERE entity='favorite'").map(row=>JSON.parse(row.payload));
    assert.ok(archived.some(row=>JSON.stringify(row)===JSON.stringify(first)));
    assert.ok(archived.some(row=>JSON.stringify(row)===JSON.stringify(second)));
    db.close();
});

test('equal-progress favorites use latest edit and deterministic canonical tie breaking', () => {
    for (const oldUpdated of ['2026-08-01','2026-09-01','2026-10-01']) {
        const db=database(); seedUser(db);
        seedFavorite(db,{updated_at:oldUpdated,quantization:'Q4_K_M'});
        seedFavorite(db,{model_id:canonical,updated_at:'2026-09-01',quantization:'Q5_K_M'});
        migrate(db);
        assert.equal(db.prepare('SELECT quantization FROM model_favorites').get().quantization,oldUpdated>'2026-09-01'?'Q4_K_M':'Q5_K_M');
        db.close();
    }
});

test('latest rating wins per user; ties favor canonical, originals are archived and aggregate counts are not doubled', () => {
    const db=database();
    for (const [i,oldUpdated] of ['2026-08-01','2026-09-01','2026-10-01'].entries()) {
        const user=`user${i}`; seedUser(db,user,`machine${i}`);
        db.prepare('INSERT INTO model_ratings VALUES (?,?,?,?,?)').run(user,oldId,1,'2026-07-01',oldUpdated);
        db.prepare('INSERT INTO model_ratings VALUES (?,?,?,?,?)').run(user,canonical,5,'2026-08-01','2026-09-01');
    }
    migrate(db);
    assert.deepEqual(rows(db,'SELECT user_id,rating,model_id FROM model_ratings ORDER BY user_id'),[
        {user_id:'user0',rating:5,model_id:canonical},{user_id:'user1',rating:5,model_id:canonical},{user_id:'user2',rating:1,model_id:canonical}
    ]);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM model_identity_merge_archive WHERE entity='rating'").get().n,6);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM model_ratings').get().n,3);
    db.close();
});

test('migration preserves malformed unrelated catalogue state and rolls back atomically on a forced failure', () => {
    const db=database(); seedUser(db); seedFavorite(db);
    db.prepare('INSERT INTO user_catalog_state VALUES (?,?,?)').run('user1','not json','2026-08-01');
    db.exec("CREATE TRIGGER prevent_favorite_delete BEFORE DELETE ON model_favorites BEGIN SELECT RAISE(ABORT,'test rollback'); END;");
    assert.throws(()=>migrate(db),/test rollback/);
    assert.equal(db.prepare('SELECT model_id FROM model_favorites').get().model_id,oldId);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='model_identity_merge_archive'").get().n,0);
    db.exec('DROP TRIGGER prevent_favorite_delete;');
    migrate(db);
    assert.equal(db.prepare('SELECT known_model_ids FROM user_catalog_state').get().known_model_ids,'not json');
    db.close();
});

// Only authentication is stubbed. Endpoint validation, HTTP responses and SQL
// execute unchanged against an isolated SQLite database; no network or real API.
async function handler(file) {
    const source=read(file).replace(/import \{ getRequiredSession, json, requireSameOrigin \} from "\.\.\/\.\.\/_lib\/auth.js";/,
        `import {json,requireSameOrigin} from '${pathToFileURL(resolve(root,'functions/_lib/auth.js'))}'; const getRequiredSession=async context=>({session:{user:{id:context.testUserId}}});`)
        .replace(/from "(\.\.[^"]+)"/g,(_,relative)=>`from '${pathToFileURL(resolve(root,file,'..',relative))}'`);
    return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
function d1(db) {
    return {prepare(sql) {return {bind(...args) {return {
        async first() {return db.prepare(sql).get(...args)||null;},
        async all() {return {results:db.prepare(sql).all(...args)};},
        async run() {return {meta:db.prepare(sql).run(...args)};}
    };}};}};
}
test('old and canonical favorite/rating API URLs address one record and allow deletion through either spelling', async () => {
    const db=database(); seedUser(db); migrate(db);
    const favorites=await handler('functions/api/favorites/[modelId].js');
    const ratings=await handler('functions/api/ratings/[modelId].js');
    const invoke=async(endpoint,kind,method,id,body)=>{
        const request=new Request(`https://localclaw.io/api/${kind}/${id}${method==='DELETE'?'?machineId=machine1':''}`,{
            method,headers:{origin:'https://localclaw.io','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})
        });
        const result=await endpoint[`onRequest${method==='PUT'?'Put':'Delete'}`]({request,testUserId:'user1',params:{modelId:id},env:{LOCALCLAW_DB:d1(db)}});
        assert.equal(result.status,200,await result.clone().text());
        return result.json();
    };
    await invoke(favorites,'favorites','PUT',oldId,{machineId:'machine1',status:'installed',quantization:'Q4_K_M',notes:'Saved through old bookmark'});
    const favorite=await invoke(favorites,'favorites','PUT',canonical,{machineId:'machine1'});
    assert.equal(favorite.favorite.modelId,canonical);
    assert.equal(favorite.favorite.status,'installed');
    assert.equal(favorite.favorite.notes,'Saved through old bookmark');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM model_favorites').get().n,1);
    await invoke(ratings,'ratings','PUT',oldId,{rating:2});
    const rating=await invoke(ratings,'ratings','PUT',canonical,{rating:5});
    assert.deepEqual(rating.aggregate,{modelId:canonical,average:5,count:1});
    await invoke(favorites,'favorites','DELETE',oldId);
    await invoke(ratings,'ratings','DELETE',oldId);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM model_favorites').get().n,0);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM model_ratings').get().n,0);
    assert.deepEqual(validateCatalogState({knownModelIds:[oldId,canonical,'qwen3-14b']}).modelIds,[canonical,'qwen3-14b']);
    db.close();
});
