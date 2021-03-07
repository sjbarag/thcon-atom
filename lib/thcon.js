'use babel';

import * as child_process from "child_process";

const DEBUG = false;

export default {

  thconListen: null,

  activate(state) {
    this.thconListen = child_process.spawn("thcon-listen", ["--verbose", "--per-process", "atom"]);
    let { stdout, stderr } = this.thconListen;

    stdout.on("data", (data) => {
      try {
        let payload = JSON.parse(data);
        DEBUG && console.log(`[thcon-atom::on_stdout] receieved JSON payload: ${payload}`);

        let loadedThemes = new Set(atom.themes.getLoadedThemeNames());

        let coreThemes = payload["core.themes"];
        let missingThemes = coreThemes.filter((t) => loadedThemes.has(t));
        if (missingThemes.length > 0) {
          missingThemes.forEach((t) =>
            console.warn(`Couldn't find loaded theme '${t}'.  You may need to install it.`)
          );
          console.error("Not applying themes because at least one is missing");
          return;
        }

        atom.config.set("core.themes", coreThemes);
      } catch (e) {
        DEBUG && console.log(`[thcon-atom::on_stdout] received non-JSON data: ${data}`);
      }
    });

    stderr.on("data", (data) => {
      DEBUG && console.log(`[thcon-atom::on_stderr] ${data}`);
    });

    this.thconListen.on("close", (exitCode) => {
      DEBUG && console.log(`[thcon-atom::on_close] thcon-listen exited with status ${exitCode}`);
    });
  },

  deactivate() {
    console.log("[thcon-atom::deactivate]");
    this.thconListen && this.thconListen.kill();
  }
};
