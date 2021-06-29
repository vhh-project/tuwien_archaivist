// Copyright 2019 Oath Inc. Licensed under the terms of the Apache 2.0 license. See LICENSE in the project root.
package baseline;

import baseline.service.Word2WordTranslator;
import com.yahoo.application.Application;
import com.yahoo.application.Networking;
import com.yahoo.application.container.Search;
import com.yahoo.component.ComponentSpecification;
import com.yahoo.component.chain.Chain;
import com.yahoo.language.Language;
import com.yahoo.language.Linguistics;
import com.yahoo.language.opennlp.OpenNlpLinguistics;
import com.yahoo.language.process.StemList;
import com.yahoo.language.process.StemMode;
import com.yahoo.prelude.query.CompositeItem;
import com.yahoo.prelude.query.Item;
import com.yahoo.prelude.query.OrItem;
import com.yahoo.prelude.query.WordItem;
import com.yahoo.search.Query;
import com.yahoo.search.Result;
import com.yahoo.search.Searcher;
import com.yahoo.search.result.Hit;
import com.yahoo.search.searchchain.Execution;
import com.yahoo.search.searchchain.testutil.DocumentSourceSearcher;
import com.yahoo.search.yql.MinimalQueryInserter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import static java.net.URLEncoder.encode;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;


/**
 * Unit tests - demonstrates:
 * <ol>
 *     <li>Build queries from YQL</li>
 *     <li>How to get the query tree, and evaluate it</li>
 *     <li>Use of tracing</li>
 *     <li>using a mock backend for hits</li>
 *     <li>Use of Application for setting up a full environment (chains) / how to build chains</li>
 *     <li>Simple use of config injection</li>
 * </ol>
 */
class MultilangSearcherTest {

    private Query multilangQuery;

    /**
     *
     */
    @BeforeEach
    void initQuery() {
        multilangQuery = new Query("/search/?yql=" +
                encode("select * from sources * where body contains \"Das sollte als deutscher Text erkannt werden.\";",
                        StandardCharsets.UTF_8));
        multilangQuery.setTraceLevel(6);
    }


    @Test
    void testChainProperlyTriggered() {
        Chain<Searcher> myChain = new Chain<>(new MinimalQueryInserter(), new MultilangSearcher(new OpenNlpLinguistics(), new Word2WordTranslator()));  // added to chain in this order
        Execution.Context context = Execution.Context.createContextStub();
        Execution execution = new Execution(myChain, context);

        Result result = execution.search(multilangQuery);
        System.out.println(result.getContext(false).getTrace());
    }

    @Test
    void testStemmer() {
        Linguistics linguistics = new OpenNlpLinguistics();
        String text = linguistics.getNormalizer().normalize("-- American");
        List<StemList> stemListList = linguistics.getStemmer()
                .stem(text, StemMode.DEFAULT, Language.fromLanguageTag("it"));
        System.out.println(stemListList.toString());
    }
}
