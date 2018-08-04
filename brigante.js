g = {
    savekey: "brigante:items",
    version: "2.0",
    cheating: false,
    basis: Math.sqrt(2) // controls how "swingy" brigante is
};

b = {};

g.initialize = function () {
    return {
        version: g.version,
        counter: 1,
        tasks: {},
        currentIdx: null,
        startTime: null,
        cheating: false,
        log: []
    };
}

g.log = function (msg) {
    var t = new Date();
    b.log.unshift([t, msg]);
};

g.taskinput = function () {
    var s = $("#newtask").val();
    if (s.length > 0) {
        g.addtask(s);
        $("#newtask").val("");
        g.draw();
    } else {
        console.log("no task");
    }
};

g.addtask = function (name) {
    g.log("added task: " + name);
    var idx = b.counter;
    b.tasks[idx] = {idx: idx, name: name, weight: 1.0};
    b.counter += 1;
};

g.save = function () {
    console.log("saving...");
    localStorage.setItem(g.savekey, JSON.stringify(b));
};

g.reset = function () {
    console.log("reinitializing...");
    b = g.initialize();
    g.save();
    g.draw();
};

g.restore = function () {
    var json = JSON.parse(localStorage.getItem(g.savekey));
    if (json && json.version == g.version) {
        console.log("restored.");
        _.each(json, function (v, k) { b[k] = v  });
    } else {
        console.log("failed to restore.");
    }

    g.draw();
};

g.draw = function () {
    if (b.cheating) {
        $("#cheat").hide();
        $("#nocheat").show();
    } else {
        $("#cheat").show();
        $("#nocheat").hide();
    }

    if (b.currentIdx == null) {
        $("#stopped").show();
        $("#running").hide();
        $("#start").prop("disabled", false);
    } else {
        $("#stopped").hide();
        $("#running").show();
        $("#start").prop("disabled", true);

        $("#curtask").empty();
        $("#curtask").append(g.currtask().name);
        var now = new Date();
        if (!b.startTime) b.startTime = now;
        var start = new Date(b.startTime);
        var date = start.toLocaleDateString();
        var time = start.toLocaleTimeString();
        var delta = Math.round((now - start) / (60 * 1000.0));
        var mins = (delta == 1) ? "minute" : "minutes"
        $("#curtask").append("<br>  (started " + delta + " " + mins + " ago at " + time + " on " + date + ")");
    }

    var items = $("#items");
    items.empty();
    if (Object.keys(b.tasks).length > 0) {
        _.each(b.tasks, function (task) {
            var name = (task.idx == b.currentIdx) ? "<i>" + task.name + "</i>" : task.name;
            items.append(" * " + task.name + " (" + task.weight + ")");
            if (b.cheating) {
                items.append(jQuery("<button/>", {
                    "id": task.idx,
                    "disabled": b.currentIdx != null
                }).append("start"));
            }
            items.append("<br>");
            $("#" + task.idx).click(function () { g.starttask(task.idx) });
        });
    } else {
        items.append("  (none)");
    }

    var log = $("#log")
    log.empty();
    if (b.log.length > 0) {
        _.each(b.log, function (entry) {
            var d = new Date(entry[0]);
            var t = d.toLocaleDateString() + " " + d.toLocaleTimeString();
            log.append(" - " + t + ": " + entry[1]);
            log.append("<br>");
        });
    } else {
        log.append("  (empty)");
    }
    g.save();
};

g.startrandom = function () {
    if (Object.keys(b.tasks).length > 0) {
        var total = 0.0;
        var chosen = null;
        _.each(b.tasks, function (task) {
            var w = Math.pow(g.basis, task.weight);
            total += w;
            var x = Math.random() * total;
            if (x <= w) {
                chosen = task;
            }
        });
        g.starttask(chosen.idx);
    } else {
        console.log("no tasks!");
    }
}

g.starttask = function (idx) {
    console.log("starting...");
    if (!b.currentIdx) {
        b.currentIdx = idx;
        g.log("started task: " + g.currtask().name);
        b.startTime = new Date();
        g.draw();
    } else {
        console.log("task already running!");
    }
};

g.currtask = function () {
    return b.currentIdx ? b.tasks[b.currentIdx] : null;
};

g.endtask = function () {
    if (b.currentIdx) {
        console.log("ending task %o", b.currentIdx);
        g.log("ended task: " + g.currtask().name);
        delete b.tasks[b.currentIdx];
        b.currentIdx = null;
        b.startTime = null;
        g.draw();
    } else {
        console.log("task not running!");
    }
};

g.pausetask = function (delta) {
    if (b.currentIdx) {
        var status = delta > 0 ? "↑" : (delta < 0 ? "↓" : "-");
        g.log("paused task: " + task.name + " (" + status +")");
        b.tasks[b.currentIdx].weight += delta;
        b.currentIdx = null;
        b.startTime = null;
        g.draw();
    } else {
        console.log("task not running!");
    }
};

$(document).ready(function () {
    b = g.initialize();
    $("#add").click(function () { g.taskinput() });
    $("#start").click(function () { g.startrandom() });
    $("#done").click(function () { g.endtask() });
    $("#great").click(function () { g.pausetask(1.0) });
    $("#notgreat").click(function () { g.pausetask(-1.0) });
    $("#ok").click(function () { g.pausetask(0.0) });
    $("#reset").click(function () { g.reset() });
    $("#cheat").click(function () { b.cheating = true; g.draw() });
    $("#nocheat").click(function () { b.cheating = false; g.draw() });
    g.restore();
    g.draw();
});
