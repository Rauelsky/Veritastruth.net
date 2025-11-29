Promise.all([
    d3.json("/static/data/statesArray.json")

]).then(function (data) {

    var statesArray = data[0];

    //Add states to the dropdown menu 'stateNav'

    var stateNav = d3.select("#stateNav")
    statesArray.forEach(state => {
        stateNav.append("option").text(state.fullName).attr("value", state.abbrev)
    })

    stateNav.insert("option", ":first-child").text("Select a State").attr("value", "default").attr("selected", "selected")

    stateNav.on("change", function () {
        var selectedState = this.value.toLowerCase()
        stateNav.property("selectedIndex", 0)
        navToSearchSelectedState(selectedState)
    })

    function navToSearchSelectedState(abbrev) {
        const baseUrl = window.location.origin;
        const searchUrl = `${baseUrl}/search` + "?state=" + abbrev.toLowerCase();
        window.location.href = searchUrl;
    }

})