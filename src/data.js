
const defaultSearchParameter = { string_ : 'wiki wikipedia encyclopedia', array : ['wiki', 'wikipedia', 'encyclopedia'], regexp : '/\\b(?:wiki|wikipedia|encyclopedia)\\b/gi', ranges : [{start : 1, length : 9}, {start : 310, length : 9}] };

const defaultJsons = {
    string_:`{"section":{"type":"string_","queryString":null,"testString":{}}}`,
    array:`{"section":{"type":"array","queryArray":null,"testString":{}}}`,
    regexp:`{"section":{"type":"regexp","queryRegExp":null,"testString":{}}}`,
    ranges:`{"section":{"type":"ranges","queryRanges":null,"testString":{}}}`,
};

// arrays can be used for performance test
const wordArrays = {
    name : 'wordArrays',
    default : defaultSearchParameter.array,
    
    topWords_50 : ['the','of','and','to','in','is','you','are','for','that','or','it','as','be','on','your','with','can','have','this','an','by','not','but','at','from','they','more','will','if','some','there','what','about','which','when','one','their','all','also','how','many','do','has','most','people','other','time','so','was'],
    
    words_50 : ['these','may','like','use','into','than','up','out','who','them','make','because','such','through','get','work','even','different','its','no','our','new','film','just','only','see','used','good','been','system','after','computer','best','must','her','life','since','could','does','now','during','learn','around','usually','form','meat','air','day','place','become','number'],
    
    words_100 : ['thanks','specific','enough','long','lot','hand','popular','small','though','experience','include','job','music','person','really','although','thank','book','early','reading','end','method','never','less','play','able','data','feel','high','off','point','type','whether','food','understanding','here','home','certain','economy','little','theory','tonight','law','put','under','value','always','body','common','market','set','bird','guide','provide','change','interest','literature','sometimes','problem','say','next','create','simple','software','state','together','control','knowledge','power','radio','ability','basic','course','economics','hard','add','company','known','love','past','price','size','away','big','internet','possible','television','three','understand','various','yourself','card','difficult','including','list','mind','particular','real','science','trade'],
    
    words_150 : ['consider','either','library','likely','nature','fact','line','product','care','group','idea','risk','several','someone','temperature','united','word','fat','force','key','light','simply','today','training','until','major','name','personal','school','top','current','generally','historical','investment','left','national','amount','level','order','practice','research','sense','service','area','cut','hot','instead','least','natural','physical','piece','show','society','try','check','choose','develop','second','useful','web','activity','boss','short','story','call','industry','last','media','mental','move','pay','sport','thing','actually','against','far','fun','house','let','page','remember','term','test','within','along','answer','increase','oven','quite','scared','single','sound','again','community','definition','focus','individual','matter','safety','turn','everything','kind','quality','soil','ask','board','buy','development','guard','hold','language','later','main','offer','oil','picture','potential','professional','rather','access','additional','almost','especially','garden','international','lower','management','open','player','range','rate','reason','travel','variety','video','week','above','according','cook','determine','future','site','alternative','demand','ever','exercise','following','image','quickly','special'],
}; 

const minHtml = `<div id="mw-page-base" class="noprint"><p>Wikipedia is the largest and most-read <a href="#">reference work</a> in history.</p></div>`;

const iframeHtml = '<h1>Iframe</h1><iframe width="500" height="250" src="http://example.com/"></iframe>';

const defaultHtml = `
<p><b>Wikipedia</b> (<span class="rt-commentedText nowrap"><span class="IPA nopopups noexcerpt" lang="en-fonipa"><a href="#">/<span style="border-bottom:1px dotted"><span>ˌ</span><span>w</span><span>ɪ</span><span>k</span><span>ɪ</span><span>ˈ</span><span>p</span><span>iː</span><span>d</span><span>i</span><span>ə</span></span>/</a></span> <span class="nowrap" style="font-size:85%">(<span class="unicode haudio"><span class="fn"><span style="white-space:nowrap;margin-right:.25em;"><a href="#"><img alt="" src="#" decoding="async" srcset="#" data-file-width="20" data-file-height="20" width="11" height="11"></a></span><a href="#" class="internal">listen</a></span></span>)</span></span> <a href="#"><i>wik-ih-<span style="font-size:90%">PEE</span>-dee-ə</i></a> or <span class="rt-commentedText nowrap"><span class="IPA nopopups noexcerpt" lang="en-fonipa"><a href="#">/<span style="border-bottom:1px dotted"><span>ˌ</span><span>w</span><span>ɪ</span><span>k</span><span>i</span></span>-/</a></span> <span class="nowrap" style="font-size:85%">(<span class="unicode haudio"><span class="fn"><span style="white-space:nowrap;margin-right:.25em;"><a href="#"><img alt="" src="#" decoding="async" srcset="#" data-file-width="20" data-file-height="20" width="11" height="11"></a></span><a href="#" class="internal">listen</a></span></span>)</span></span> <a href="#"><i>wik-ee-</i></a>) is a <a href="#">multilingual</a> <a href="#" class="mw-redirect">free online encyclopedia</a> written and maintained by a community of <a href="#" class="mw-redirect">volunteers</a> through <a href="#">open collaboration</a> and a <a href="#">wiki</a>-based editing system. Individual contributors, also called editors, are known as <a href="#" class="mw-redirect">Wikipedians</a>. Wikipedia is the largest and most-read <a href="#">reference work</a> in history.<sup id="cite_ref-Wiki20_5-0" class="reference"><a href="#">[3]</a></sup> It is consistently one of the 10 <a href="#">most popular websites</a> ranked by the <a href="#">Similarweb</a> and former <a href="#">Alexa</a>; as of 2022,<sup class="plainlinks noexcerpt noprint asof-tag update" style="display:none;"><a class="external text pressed" href="#">[update]</a></sup> Wikipedia was ranked the 7th most popular site.<sup id="cite_ref-Wiki20_5-1" class="reference"><a href="#">[3]</a></sup><sup id="cite_ref-Alexa_siteinfo_6-0" class="reference"><a href="#">[4]</a></sup><sup id="cite_ref-Similarweb_7-0" class="reference"><a href="#">[5]</a></sup> It is hosted by the <a href="#">Wikimedia Foundation</a>, an <a href="#">American non-profit organization</a> funded mainly through donations.<sup id="cite_ref-8" class="reference"><a href="#">[6]</a></sup></p>
<p>On January 15, 2001, <a href="#">Jimmy Wales</a><sup id="cite_ref-auto1_9-0" class="reference"><a href="#">[7]</a></sup> and <a href="#">Larry Sanger</a> launched Wikipedia.Sanger coined its name as a <a href="#">blend</a> of  "wiki" and "encyclopedia."<sup id="cite_ref-MiliardWho_10-0" class="reference"><a href="#">[8]</a></sup><sup id="cite_ref-J_Sidener_11-0" class="reference"><a href="#">[9]</a></sup>Wales was influenced by the "<a href="#">spontaneous order</a>" ideas associated with <a href="#">Friedrich Hayek</a> and the <a href="#">Austrian School</a> of economics, after being exposed to these ideas by Austrian economist and <a href="#">Mises Institute</a> Senior Fellow <a href="#">Mark Thornton</a>.<sup id="cite_ref-12" class="reference"><a href="#">[10]</a></sup> Initially available only in English, versions in other languages werequickly developed. Its combined editions comprise more than 58 millionarticles, attracting around 2<span class="nowrap">&nbsp;</span>billion unique device visits per month and more than 17 million edits per month (1.9<span class="nowrap">&nbsp;</span>edits per second) as of November&nbsp;2020<sup class="plainlinks noexcerpt noprint asof-tag update" style="display:none;"><a class="external text pressed" href="#">[update]</a></sup>.<sup id="cite_ref-small_screen_13-0" class="reference"><a href="#">[11]</a></sup><sup id="cite_ref-Wikimedia_Stats_14-0" class="reference"><a href="#">[12]</a></sup>In 2006, <i><a href="#">Time magazine</a></i> stated that the policy of allowing anyone to edit had made Wikipedia the "biggest (and perhaps best) encyclopedia in the world."<sup id="cite_ref-auto1_9-1" class="reference"><a href="#">[7]</a></sup></p>
`;

const testJSONs = {
    string_ :`{"section":{"type":"string_","element":"span","className":"test","exclude":"['h1','.ignore']","accuracy":"object","accuracyObject":"{'value':'exactly','limiters':[',','.']}","synonyms":"{'one':'1'}","iframes":true,"iframesTimeout":4999,"acrossElements":true,"caseSensitive":true,"ignoreJoiners":true,"ignorePunctuation":"[',','.']","wildcards":"enabled","debug":true,"filterCallback":"return true;","eachCallback":"n++;","queryString":"query test","testString":"Test html string."}}`,
    array :`{"section":{"type":"array","className":"test","exclude":"['h1','.ignore']","accuracy":"object","accuracyObject":"{'value':'exactly','limiters':[',','.']}","synonyms":"{'one':'1'}","iframes":true,"iframesTimeout":4999,"acrossElements":true,"caseSensitive":true,"ignoreJoiners":true,"ignorePunctuation":"[',','.']","wildcards":"enabled","cacheTextNodes":true,"wrapAllRanges":true,"debug":true,"filterCallback":"return true;","eachCallback":"n++;","queryArray":"['query','test']","testString":"Test html string."}}`,
    regexp :`{"section":{"type":"regexp","element":"span","className":"test","exclude":"['h1','.ignore']","iframes":true,"iframesTimeout":4999,"acrossElements":true,"ignoreGroups":1,"debug":true,"filterCallback":"return true;","eachCallback":"n++;","queryRegExp":"/\\b(?:query|test)\\b/gi","testString":"Test html string."}}`,
    ranges :`{"section":{"type":"ranges","element":"span","className":"test","exclude":"['h1','.ignore']","iframes":true,"iframesTimeout":4999,"wrapAllRanges":true,"debug":true,"filterCallback":"return true;","eachCallback":"n++;","queryRanges":"[{'start':0,'length':5},{'start':10,'length':6}]","testString":"Test html string."}}`
};













