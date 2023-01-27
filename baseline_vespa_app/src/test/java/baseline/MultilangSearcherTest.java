// Copyright 2019 Oath Inc. Licensed under the terms of the Apache 2.0 license. See LICENSE in the project root.
package baseline;

import baseline.model.StemFilter;
import baseline.service.Word2WordTranslator;
import com.google.gson.Gson;
import com.yahoo.application.Application;
import com.yahoo.application.Networking;
import com.yahoo.application.container.JDisc;
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
import com.yahoo.prelude.querytransform.PhrasingSearcher;
import com.yahoo.prelude.searcher.FieldCollapsingSearcher;
import com.yahoo.processing.execution.chain.ChainRegistry;
import com.yahoo.search.Query;
import com.yahoo.search.Result;
import com.yahoo.search.Searcher;
import com.yahoo.search.result.Hit;
import com.yahoo.search.searchchain.Execution;
import com.yahoo.search.searchchain.testutil.DocumentSourceSearcher;
import com.yahoo.search.yql.MinimalQueryInserter;

import lombok.SneakyThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

import static java.net.URLEncoder.encode;
import static org.junit.Assert.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;


/**
 * Unit tests for manual debugging
 */
class MultilangSearcherTest {

    private Query multilangQuery;

    /**
     *
     */
    @SneakyThrows
    @BeforeEach
    void initQuery() {
        StemFilter[] stemFilters = {
                new StemFilter("en", "or"),
//                new StemFilter("en", "apple", "core")
        };
        var stemFiltersString = URLEncoder.encode(new Gson().toJson(stemFilters), StandardCharsets.UTF_8.toString());
        stemFiltersString = String.format("%s=%s", Constants.STEM_FILTER_PROP, stemFiltersString);

        multilangQuery = new Query("/search/?"+ stemFiltersString +"&yql=" +
                encode("select * from sources * where default contains 'war' and default contains 'mission'",// and default contains \"signal\" and language matches\"de\";",
//                encode("select * from sources * where default contains \"war zone\" and language matches \"de\" order by parent_doc desc, page desc;",
                                StandardCharsets.UTF_8));
        multilangQuery.setTraceLevel(6);
    }


    @Test
    void testChainProperlyTriggered() {
        Chain<Searcher> myChain = new Chain<>(new MinimalQueryInserter(), new MultilangSearcher(new OpenNlpLinguistics(), new Word2WordTranslator()), new StemFilterSearcher());  // added to chain in this order
        Execution.Context context = Execution.Context.createContextStub();
        Execution execution = new Execution(myChain, context);

        Result result = execution.search(multilangQuery);
        System.out.println(result.getContext(false).getTrace());
    }

    @Test
    void testChainInsideContainer() {
        String servicesXML = "<container version=\"1.0\">\n" +
                "        <search>\n" +
                "            <chain id=\"multilangchain\" inherits=\"vespa\">\n" +
                "                <searcher id=\"baseline.MultilangSearcher\" bundle=\"baseline\" after=\"MinimalQueryInserter\">\n" +
                "                </searcher>\n" +
                "            </chain>\n" +
                "            <renderer id=\"query-meta-json\" class=\"baseline.QueryMetadataJsonRenderer\" bundle=\"baseline\" />\n" +
                "    \t</search>\n" +
                "    </container>";

        try (JDisc container = JDisc.fromServicesXml(servicesXML, Networking.disable)) {
            ChainRegistry<Searcher> chains = container.search().getChains();
            Chain<Searcher> multilangchain = chains.getComponent("multilangchain");
            Execution.Context context = Execution.Context.createContextStub();
            Execution execution = new Execution(multilangchain, context);
            Result result = execution.search(multilangQuery);
//            Result result = container.search().process(ComponentSpecification.fromString("multilangchain"), multilangQuery);
            System.out.println(result.getContext(false).getTrace());
//            assertNotNull(result.hits().get("test"));
        }
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
