/**
 *    Copyright 2017 PeopleWare n.v.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Contract = require("@toryt/contracts-ii");
const path = require("path");
const fs = require("fs");
const Q = require("q");
const Git = require("nodegit");

/**
 * Turns an object of promises into a promise for an object.  If any of
 * the promises gets rejected, the whole object is rejected immediately.
 * @param {object} promises - an object (or promise for an object) of properties with values (or
 *                            promises for values)
 * @return {object|Promise<object>} a promise for an array of the corresponding values
 */
function object(promises) {
  if (!promises) {
    return promises;
  }
  return Q.all(Object.keys(promises).map((key) => Q.when(promises[key], (value) => ({key, value}))))
          .then((kvPairs) => kvPairs.reduce(
            (acc, kvPair) => {
              acc[kvPair.key] = kvPair.value;
              return acc;
            },
            {}
          ));
}

// monkey patch object on q
Q.object = object;

/**
 * Holder for consolidated information about the git repository at {@code #path}.
 */
class GitInfo {

  get invariants() {
    return typeof this.path === "string"
      && !!this.path
      /* We will not add an invariant that this path exists. 1) That can only be determined
         asynchronously, and we don't want that for invariants(). 2) The disk can be changed after
         creation of this object. */
      && typeof this.sha === "string"
      && GitInfo.shaRegExp.test(this.sha)
      && this.branch === undefined || (typeof this.branch === "string" && !!this.branch)
      && this.originUrl === undefined || (typeof this.originUrl === "string" && !!this.originUrl)
      && this.changes instanceof Set
      && Array.from(this.changes).every(path => typeof path === "string" && !!path)
      && typeof this.isClean === "boolean"
      && this.isClean === (this.changes.size === 0)
      && typeof this.isPrecious === "boolean"
      && this.branch || this.isPrecious
      && GitInfo.preciousBranchNameFragments.every(fragment => this.branch.indexOf(fragment) < 0) || this.isPrecious;
  }

  /**
   * Create a new GitInfo instance with the given properties.
   *
   * @param {String} path - path to the git repository represented by the new instance;
   *                        should be a path to a directory that contains a {@code .git/} folder
   * @param {String} sha - sha of the current commit of the checked-out repository
   * @param {String?} branch - name of the current checked-out branch; might be {@code undefined}
   * @param {String?} originUrl - url of the remote with name {@code origin} of the current checked-out branch;
   *                              might be {@code undefined}
   * @param {Set<String>} changes - set of paths of files that are not committed in the working copy
   *                                referred to by {@code path}; files are deleted, new, or modified
   */
  constructor(path, sha, branch, originUrl, changes) {
    this._path = path;
    this._sha = sha;
    this._branch = branch || undefined;
    this._originUrl = originUrl || undefined;
    this._changes = new Set(changes);
  }

  /**
   * Path to the git repository represented by this.
   *
   * @return {String}
   */
  get path() {
    return this._path;
  }

  /**
   * Sha of the current commit of the checked-out repository.
   *
   * @return {String}
   */
  get sha() {
    return this._sha;
  }

  /**
   * Name of the current checked-out branch. Might be {@code undefined}.
   *
   * @return {String?}
   */
  get branch() {
    return this._branch;
  }

  /**
   * Url of the remote with name {@code origin} of the current checked-out branch.
   * Might be {@code undefined}.
   *
   * @return {String?}
   */
  get originUrl() {
    return this._originUrl;
  }

  /**
   * Set of paths of files that are not committed in the working copy referred to by {@code path}.
   * Files are deleted, new, or modified.
   *
   * @return {Set<String>}
   */
  get changes() {
    return new Set(this._changes);
  }

  /**
   * This represents a clean git repo working copy.
   */
  get isClean() {
    return this.changes.size === 0;
  }

  /**
   * This represents a git repo, of which a precious branch is checked out.
   * No branch is precious too.
   */
  get isPrecious() {
    return !this.branch || GitInfo.preciousBranchNameFragments.some(fragment => 0 <= this.branch.indexOf(fragment));
  }

  toJSON() {
    return {
      path: this.path,
      sha: this.sha,
      branch: this.branch,
      originUrl: this.originUrl,
      changes: Array.from(this.changes),
      isClean: this.isClean,
      isPrecious: this.isPrecious
    };
  }

}

GitInfo.constructorContract = new Contract({
  pre: [
    (path, sha, branch, originUrl, changes) => typeof path === "string",
    (path, sha, branch, originUrl, changes) => !!path,
    (path, sha, branch, originUrl, changes) => typeof sha === "string",
    (path, sha, branch, originUrl, changes) => GitInfo.shaRegExp.test(sha),
    (path, sha, branch, originUrl, changes) => !branch || typeof branch === "string",
    (path, sha, branch, originUrl, changes) => !originUrl || typeof originUrl === "string",
    (path, sha, branch, originUrl, changes) => changes instanceof Set,
    (path, sha, branch, originUrl, changes) => Array.from(changes).every(path => typeof path === "string" && !!path)
  ],
  post: [
    (path, sha, branch, originUrl, changes, result) => result.path === path,
    (path, sha, branch, originUrl, changes, result) => result.sha === sha,
    (path, sha, branch, originUrl, changes, result) => !!branch || result.branch === undefined,
    (path, sha, branch, originUrl, changes, result) => !branch || result.branch === branch,
    (path, sha, branch, originUrl, changes, result) => !!originUrl || result.originUrl === undefined,
    (path, sha, branch, originUrl, changes, result) => !originUrl || result.originUrl === originUrl,
    (path, sha, branch, originUrl, changes, result) => Array.from(changes).every(path => result.changes.has(path)),
    (path, sha, branch, originUrl, changes, result) => Array.from(result.changes).every(path => changes.has(path))
  ],
  exception: [() => false]
});

GitInfo.shaRegExp = /^[a-f0-9]{40}$/;
GitInfo.preciousBranchNameFragments = ["prod", "staging", "stage", "test"];
GitInfo.originRemoteName = "origin";
GitInfo.gitRefsPattern = /^refs\/heads\/(.*)$/;

/**
 * Promise for the path of the directory of the highest git working copy {@code path} is in. This is the top most
 + ancestor directory of {@code path} that contains a {@code .git} folder.
 */
GitInfo.highestGitDirPath = new Contract({
  pre: [
    (dirPath) => typeof dirPath === "string"
  ],
  post: [
    (dirPath, result) => Q.isPromiseAlike(result)
  ],
  exception: [() => false]
})
.implementation(dirPath => {
  const parts = dirPath.split(path.sep);
  const dirs = parts.map((part, index) => parts.slice(0, index + 1).join(path.sep));
  return Q.all(dirs.map(dir => Q.nfcall(fs.access, path.format({dir: dir, name: ".git"}), "rw")
                                .then(() => dir)
                                .catch(() => undefined)))
    .then(gitDirs => gitDirs.find(dir => !!dir))
    .then(
      new Contract({
        pre: [
          result => result === undefined || (typeof result === "string" && !!result),
          result => !result || dirPath.startsWith(result)
        ],
        post: [(highestGitDirPath, result) => result === highestGitDirPath],
        exception: [() => false]
      }).implementation(highestGitDirPath => highestGitDirPath),
      new Contract({
        pre:       [(err) => false],
        post:      [() => false],
        exception: [(err1, err2) => err1 === err2]
      }).implementation(err => {throw err;})
    );
});

/**
 * Helper function to decide whether a NodeGit Status represents a clean or dirty file.
 */
GitInfo.isNotClean = new Contract({
  pre: [
    (status) => typeof status.isNew === "function",
    (status) => typeof status.isModified === "function",
    (status) => typeof status.isTypechange === "function",
    (status) => typeof status.isRenamed === "function",
    (status) => typeof status.isDeleted === "function",
    (status) => typeof status.isIgnored === "function"
  ],
  post: [
    (status, result) => typeof result === "boolean",
    (status, result) => !status.isNew() || result,
    (status, result) => !status.isModified() || result,
    (status, result) => !status.isTypechange() || result,
    (status, result) => !status.isRenamed() || result,
    (status, result) => !status.isDeleted() || result,
    (status, result) => !status.isIgnored() || !result
  ],
  exception: [() => false]
}).implementation(function(status) {
  return !!(status.isNew() || status.isModified() || status.isTypechange() || status.isRenamed() || status.isDeleted());
});

/**
 * Promise for the git working copy information in {@code gitDirPath}.
 * The promise is rejected if {@code gitDirPath} does not point to a git working copy.
 */
GitInfo.create = new Contract({
  pre: [
    (gitDirPath) => typeof gitDirPath === "string",
    (gitDirPath) => !!gitDirPath
  ],
  post:      [
    (dirPath, result) => Q.isPromiseAlike(result)
  ],
  exception: [() => false]
}).implementation(function(gitDirPath) {
  //noinspection JSUnresolvedVariable
  return Git.Repository
    .open(gitDirPath)
    .catch(() => {throw new Error(gitDirPath + " is not a git directory");})
    .then(repository => {
      //noinspection JSCheckFunctionSignatures
      return Q.object({
        sha: repository
          .getHeadCommit()
          .then(head => head.sha()),
        branch: repository
          .getCurrentBranch()
          .then(reference => GitInfo.gitRefsPattern.exec(reference.name())[1]),
        originUrl: repository
          .getRemote(GitInfo.originRemoteName)
          .catch(() => new Error("remote \"" + GitInfo.originRemoteName + "\" does not exist"))
          .then(remote => remote.url()),
        changes: repository
          .getStatus()
          .then(statuses =>  new Set(statuses.filter(isNotClean).map(status => status.path())))
      })
      .then(params => new GitInfo(
        gitDirPath,
        params.sha,
        params.branch,
        params.originUrl,
        params.changes
      ));
    })
    .then(
      new Contract({
        pre: [
          gitInfo => gitInfo instanceof GitInfo,
          gitInfo => gitInfo.path === gitDirPath
        ],
        post: [(gitInfo, result) => result === gitInfo],
        exception: [() => false]
      }).implementation(gitInfo => gitInfo),
      new Contract({
        pre: [(err) => err instanceof Error],
        post: [() => false],
        exception: [(err1, err2) => err1 === err2]
      }).implementation(err => {throw err;})
    );
});

module.exports = GitInfo;
