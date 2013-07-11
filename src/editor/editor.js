(function() {

var tree, rootNode, form;
var nodeIdCounter = 2;

function addNode() {
    var ui = $(this).data("webvs-ui");
    var data = {
        id: nodeIdCounter++,
        ui: ui,
        label: ui.disp,
    };
    tree.tree("appendNode", data, rootNode);
    tree.tree("openNode", rootNode);
}

function removeNode(e) {
    var node = tree.tree("getSelectedNode");
    if(node.id === 1) {
        return;
    }
    tree.tree("selectNode", node.parent);
    tree.tree("removeNode", node);
}

function nodeSelect(e) {
    var node = e.node;
    form.empty();
    if(!node) {
        return;
    }
    form.jsonForm({
        schema: node.ui.schema,
        form: node.ui.form || ["*"],
        onSubmitValid: formSubmitValid,
        value: node.values
    });
}

function formSubmitValid(values) {
    var selectedNode = tree.tree("getSelectedNode");
    selectedNode.values = values;
    console.dir(generateJson());
}

function generateJson(node) {
    var json = {};
    if(!node) {
        node = rootNode;
    } else {
        json.type = node.ui.type;
    }

    if(node.children && node.children.length > 0) {
        json.components = _.map(node.children, generateJson);
    }

    json = _.extend(json, node.values);
    return json;
}

function search(e) {
    e.preventDefault();
    var input = $("#search-form input");
    var list = $("#search-result ul");
    var query = input.val();
    SC.get("/tracks", {q: query}, function(tracks) {
        input.val("");
        list.empty();
        _.each(tracks, function(track) {
            var link = $("<a href='#'/>").data("webvs-track", track).text(track.title);
            $("<li/>").append(link).appendTo(list);
        });
    });
}

function queueTrack() {
    var track = $(this).data("webvs-track");
    var list = $("#play-queue ul");
    $("<li/>").data("webvs-track", track).text(track.title).appendTo(list);
}

function initUI() {
    // initialize the add effect menu
    _.chain(Webvs).values().filter(function(value) {
        return _.isFunction(value) && _.isObject(value.ui);
    }).map(function(value) { 
        var ui = _.defaults(value.ui, {
            leaf: true
        });
        return ui;
    }).each(function(ui) {
        $("<li><a href='#'>"+ui.disp+"</a></li>").data("webvs-ui", ui).appendTo(".new-button .dropdown-menu");
    });

    //initialize form
    form = $('.form');

    // initialize the tree
    tree = $(".tree");
    tree.tree({
        dragAndDrop: true,
        onCanMoveTo: function(movedNode, targetNode, position) {
            var targetUi = targetNode.ui;
            return ((position != "inside" || !targetUi.leaf) && (targetNode.id !== 1 || position == "inside"));
        },
        data: [
            {
                id: 1,
                ui: Webvs.ui,
                label: "Main"
            }
        ]
    });
    rootNode = tree.tree("getNodeById", 1);
    tree.tree("selectNode", rootNode);
    nodeSelect({node: rootNode});

    // ---- Begin event Bindings ----
    $(".new-button .dropdown-menu li").click(addNode);
    $(".remove-button").click(removeNode);
    tree.bind("tree.select", nodeSelect);
    form.change(function() { form.submit(); }); // submit the form on change so that we get values from jsonform
    $("#search-form").submit(search);
    $(document).on("click", "#search-result ul li a", queueTrack);
}

$(document).ready(function() {
    initUI();
    SC.initialize({
        client_id: "e818e8c85bb8ec3e90a9bbca23ca5e2a"
    });
});

})();
