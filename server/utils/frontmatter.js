/**
 * Frontmatter utilities.
 *
 * @module server/utils/frontmatter
 */
const { readFile } = require('fs-extra');
const { safeLoad: loadYaml } = require('js-yaml');

const FRONTMATTER_REGEXP = /^---(.*)---\n*/s;

/**
 * Loads the specified file and separates the optional YAML frontmatter at the
 * beginning from the rest of the contents.
 *
 * YAML frontmatter is a section of YAML content at the top of a file (of any
 * format) delimited by `---` above and below:
 *
 *     ---
 *     front: matter
 *     foo: [ bar, baz ]
 *     ---
 *
 *     Actual content
 *
 * It can be used to include structured metadata in files.
 *
 * @param {string} file - The path to the file to load.
 * @returns {ContentsWithFrontmatter} The parsed frontmatter and actual contents of the file.
 */
exports.loadFileWithFrontmatter = async function(file) {

  const contents = await readFile(file, 'utf8');
  const frontmatterMatch = contents.match(FRONTMATTER_REGEXP);

  return {
    contents: frontmatterMatch ? contents.slice(frontmatterMatch[0].length) : contents,
    frontmatter: frontmatterMatch ? loadYaml(frontmatterMatch[1]) : {}
  };
};

/**
 * @typedef ContentsWithFrontmatter
 * @property {Object} frontmatter - The parsed YAML frontmatter (an empty object if there was none).
 * @property {string} contents - The contents without the frontmatter.
 */
