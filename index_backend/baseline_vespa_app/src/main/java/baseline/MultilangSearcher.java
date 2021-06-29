// Copyright 2019 Oath Inc. Licensed under the terms of the Apache 2.0 license. See LICENSE in the project root.
package baseline;

import baseline.model.MultiTranslation;
import baseline.model.MultiTranslationPart;
import baseline.model.Translation;
import baseline.model.TranslationRequest;
import baseline.service.Word2WordTranslator;
import baseline.service.retrofit.ServiceBuilder;
import baseline.service.retrofit.Word2wordService;
import com.google.gson.Gson;
import com.google.inject.Inject;
import com.yahoo.component.ComponentId;
import com.yahoo.language.Language;
import com.yahoo.language.Linguistics;
import com.yahoo.language.detect.Detection;
import com.yahoo.language.process.StemList;
import com.yahoo.language.process.StemMode;
import com.yahoo.language.process.Token;
import com.yahoo.prelude.query.*;
import com.yahoo.search.Query;
import com.yahoo.search.Result;
import com.yahoo.search.Searcher;
import com.yahoo.search.query.QueryTree;
import com.yahoo.search.searchchain.Execution;
import com.yahoo.yolean.chain.After;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Searcher which adds an OR-term to queries with Metal intent - demonstrates:
 * <ol>
 *     <li>How to get the query tree, and modify it</li>
 *     <li>Use of tracing</li>
 * </ol>
 */
@After("MinimalQueryInserter")
public class MultilangSearcher extends Searcher {

    private Linguistics linguistics;
    private Word2WordTranslator translator;

    @Inject
    public MultilangSearcher(Linguistics linguistics, Word2WordTranslator translator) {
        this.linguistics = linguistics;
        this.translator = translator;
    }

    public MultilangSearcher() {

    }

    /**
     * Search method takes the query and an execution context.  This method can
     * manipulate both the Query object and the Result object before passing it
     * further in the chain.
     * 
     * @see https://docs.vespa.ai/documentation/searcher-development.html
     */
    @Override
    public Result search(Query query, Execution execution) {
        QueryTree tree = query.getModel().getQueryTree();
        Item root = tree.getRoot();
        Item queryItem;
        String queryBody = "";
        String indexName = "";

        if (root instanceof AndItem) {
            // assuming two-part query with language filter
            queryItem = ((AndItem) root).getItem(0);
        } else {
            queryItem = root;
        }

        // assuming basic query with single contains clause for "body" field
        if (queryItem instanceof IndexedSegmentItem) {
            IndexedSegmentItem item = (IndexedSegmentItem) queryItem;
            queryBody = item.stringValue();
            indexName = item.getIndexName();
        } else if (queryItem instanceof TermItem) {
            TermItem item = (TermItem) queryItem;
            queryBody = item.stringValue();
            indexName = item.getIndexName();
        }

        if (indexName.equals("body") || indexName.equals("default")) {
            query.trace("String value of query: '" + queryBody + "'", true, 2);

            Detection detection = linguistics.getDetector().detect(queryBody, null);
            Language detectedLanguage = detection.getLanguage();
            query.trace(String.format("Detected language: '%s'", detectedLanguage.languageCode()), 2);

            List<String> words = StreamSupport
                    .stream(linguistics.getTokenizer()
                            .tokenize(queryBody, detectedLanguage, StemMode.NONE, false)
                    .spliterator(), false)
                    .filter(token -> token.isIndexable())
                    .map(token -> token.getOrig())
                    .collect(Collectors.toList());

            try {
                Gson gson = new Gson();
                MultiTranslation multiTranslation = translator.multiTranslate(words, detectedLanguage.languageCode());
                query.getContext(true).setProperty(Constants.TRANSLATIONS, gson.toJson(multiTranslation));
                query.trace("Translator result: " + gson.toJson(multiTranslation),true, 2);

                Map<String, List<StemList>> stems = new HashMap<>();
                for (MultiTranslationPart translationPart: multiTranslation.getTranslations()) {
                    String text = String.join(" ", translationPart.getContent());
                    text = linguistics.getNormalizer().normalize(text);
                    List<StemList> stemListList = linguistics.getStemmer()
                            .stem(text, StemMode.DEFAULT, Language.fromLanguageTag(translationPart.getLanguageCode()));

                    stems.put(translationPart.getLanguageCode(), stemListList);
                }
                query.trace("Stemmed translations: " + gson.toJson(stems), false, 2);

                RankItem rankItem = new RankItem();
                WeakAndItem weakAndItem = new WeakAndItem();

                for (int i = 0; i < words.size(); i++) {
                    EquivItem equivalenStems = new EquivItem();
                    for (String languageCode: multiTranslation.getLanguages()) {
                        StemList wordStems = stems.get(languageCode).get(i);
                        if (wordStems.size() > 1) {
                            PhraseItem compositeStemsItem = new PhraseItem();
                            for (String stem: wordStems) {
                                compositeStemsItem.addItem(new WordItem(stem));
                            }
                            equivalenStems.addItem(compositeStemsItem);
                        } else {
                            TermItem stemItem = new WordItem(wordStems.get(0));
                            equivalenStems.addItem(stemItem);
                        }
                    }

                    weakAndItem.addItem(equivalenStems);
                }

                rankItem.addItem(weakAndItem);
                for (String word: words) {
                    rankItem.addItem(new WordItem(word));
                }

                if (root instanceof AndItem) {
                    // assuming two-part query with language filter
                    ((AndItem) root).setItem(0, rankItem);
                } else {
                    root = rankItem;
                }
                query.getModel().getQueryTree().setRoot(root);
                query.trace("Query modification done", true, 2);
            } catch (Word2WordTranslator.TranslateExecption translateExecption) {
                query.trace("Translator failed: " + translateExecption.getMessage(), 2);
            }
        }
        query.trace("MultilangSearcher was called in chain", true, 2);
        return execution.search(query);
    }
}
