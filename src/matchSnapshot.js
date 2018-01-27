const jsDiff              = require('diff')
const path                = require('path')
const stringify           = require('./stringify')
const getPrintableDiff    = require('./getPrintableDiff')
const getExistingSnaps    = require('./getExistingSnaps')
const getNormalizedTarget = require('./getNormalizedTarget')
const persistSnaps        = require('./persistSnaps')

const snapshotExtension     = '.mocha-snapshot'
const snapshotsFolder       = '__snapshots__'
const shouldUpdateSnapshots = process.env.UPDATE || process.argv.includes('--update')

module.exports = function (what, currentContext) {
  const dirName          = path.dirname(currentContext.runnable.file)
  const fileName         = path.basename(currentContext.runnable.file)
  const snapshotDir      = path.join(dirName, snapshotsFolder)
  const snapshotFilePath = path.join(snapshotDir, fileName + snapshotExtension)
  const testName         = currentContext.title + '(' + (currentContext.titleIndex++) + ')'
  const snaps            = getExistingSnaps(snapshotDir, snapshotFilePath)
  const target           = getNormalizedTarget(what)

  let snapDidChange = true

  if (snaps.hasOwnProperty(testName)) {
    const existingSnap = stringify(snaps[ testName ])
    const newSnap      = stringify(target)
    const diffResult   = jsDiff.diffLines(existingSnap, newSnap)

    snapDidChange = diffResult.some(it => it.removed || it.added)

    if (snapDidChange && !shouldUpdateSnapshots) {
      const output = getPrintableDiff(diffResult)
      throw new Error('Snapshot didn\'t match' + output)
    }
  }

  if (snapDidChange) {
    snaps[ testName ] = target
    persistSnaps(snaps, snapshotFilePath)
  }
}