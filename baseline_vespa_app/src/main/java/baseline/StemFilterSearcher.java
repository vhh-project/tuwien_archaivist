package baseline;

import baseline.model.StemFilter;
import com.google.gson.Gson;
import com.yahoo.container.QrSearchersConfig;
import com.yahoo.prelude.query.*;
import com.yahoo.search.Query;
import com.yahoo.search.Result;
import com.yahoo.search.Searcher;
import com.yahoo.search.query.QueryTree;
import com.yahoo.search.searchchain.Execution;
import com.yahoo.yolean.chain.After;

import java.util.Arrays;
import java.util.stream.Collectors;

@After("MultilangSearcher")
public class StemFilterSearcher extends Searcher {

    @Override
    public Result search(Query query, Execution execution) {
        QueryTree tree = query.getModel().getQueryTree();
        Item root = tree.getRoot();
        Gson gson = new Gson();

        var stemFilters =
                gson.fromJson((String) query.properties().get(Constants.STEM_FILTER_PROP), StemFilter[].class);

        if (stemFilters == null || stemFilters.length == 0) {
            // Nothing to filter
            return execution.search(query);
        }

        CompositeItem rootItem = null;
        if (root instanceof AndItem) {
            if (((AndItem) root).getItem(0) instanceof WeakAndItem) {
                rootItem = (CompositeItem) root;
            } else {
                // Not in the supported format
                return execution.search(query);
            }

            var filterLanguage = getFilterLanguage((AndItem) root);
            var stemFilter = getMatchingStemFilter(stemFilters, filterLanguage);
            if (stemFilter != null) {
                filterStems(rootItem, stemFilter);
                query.trace(String.format("Filtering done: %s", Arrays.toString(stemFilters)), true, 2);
                return execution.search(query);
            } else if(filterLanguage != null) {
                // Query has language filtered, but there are no stems for filtered language
                return execution.search(query);
            }
        } else if (root instanceof WeakAndItem) {
            rootItem = (CompositeItem) root;
        } else {
            // Wrong format
            return execution.search(query);
        }

        OrItem orItem = new OrItem();
        AndItem baseItem = new AndItem();
        baseItem.addItem(rootItem);
        baseItem.addItem(buildLanguageExclude(stemFilters));
        orItem.addItem(baseItem);

        for (StemFilter filter: stemFilters) {
            AndItem filterAndItem = new AndItem();
            RegExpItem regExpItem = new RegExpItem(Constants.LANGUAGE_FIELD, true, filter.getLanguage());
            CompositeItem filterRankItem = rootItem.clone();
            filterStems(filterRankItem, filter);
            filterAndItem.addItem(filterRankItem);
            filterAndItem.addItem(regExpItem);
            orItem.addItem(filterAndItem);
        }

        query.getModel().getQueryTree().setRoot(orItem);
        query.trace(String.format("Filtering done: %s", Arrays.toString(stemFilters)), true, 2);
        return execution.search(query);
    }

    private NotItem buildLanguageExclude(StemFilter[] stemFilters) {
        NotItem notItem = new NotItem();
        String regExp = Arrays
                .stream(stemFilters)
                .map(stemFilter -> stemFilter.getLanguage())
                .collect(Collectors.joining("|", "(", ")"));
        RegExpItem regExpItem = new RegExpItem(Constants.LANGUAGE_FIELD, true, regExp);
        notItem.addNegativeItem(regExpItem);
        return notItem;
    }

    private void filterStems(CompositeItem compositeItem, StemFilter stemFilter) {
        for (Item item: compositeItem.items()) {
            if (item instanceof CompositeItem) {
                filterStems((CompositeItem) item, stemFilter);
            }
        }

        for (int i = 0; i < compositeItem.items().size(); i++) {
            Item subItem = compositeItem.getItem(i);
            if (isWordItemMatch(subItem, stemFilter)) {
                compositeItem.removeItem(i);
                i--;
            }
        }
    }

    private boolean isWordItemMatch(Item item, StemFilter stemFilter) {
        if (item instanceof WordItem) {
            return stemFilter.getStems().contains(((WordItem) item).getWord());
        }
        return false;
    }

    private StemFilter getMatchingStemFilter(StemFilter[] stemFilters, String language) {
        if (language == null) return null;
        return Arrays
                .stream(stemFilters)
                .filter(stemFilter -> stemFilter.getLanguage().equals(language))
                .findFirst()
                .orElse(null);
    }

    private String getFilterLanguage(CompositeItem andItem) {
        return andItem.items()
                .stream()
                .filter(item -> item instanceof RegExpItem && ((RegExpItem) item).getIndexName().equals(Constants.LANGUAGE_FIELD))
                .map(item -> ((RegExpItem) item).getRegexp().toString())
                .findFirst()
                .orElse(null);
    }
}
