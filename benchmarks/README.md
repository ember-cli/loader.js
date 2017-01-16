### Running benchmarks

note: these benchmarks run in seperate processes, the idea is to similate
initial load + use, not after the JIT has settled

```sh
env NODE_ENV=production node ./build.js && ./benchmarks/runner.js ./benchmarks/scenarios/<name of scenario>
```

If you want to run in a single process, to easily debug or run a profiler the
`run-once.js` should be considered

```sh
env NODE_ENV=production node ./build.js && ./benchmarks/run-once.js ./benchmarks/scenarios/<name of scenario>
```

Running with the profiler:

```sh
env NODE_ENV=production node --prof ./build.js && ./benchmarks/run-once.js ./benchmarks/scenarios/<name of scenario>

# to view the output:
node --prof-process isolate-0x<name of file>
```
