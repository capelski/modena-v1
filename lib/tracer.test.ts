import { expect, use } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import winston from 'winston';
import * as tracer from './tracer';

use(sinonChai);

const disableLogs = (callback: Function, done: MochaDone) => {
    const consoleLog = console.log;
    const winstonLog = winston.log;
    const winstonInfo = winston.info;
    const winstonError = winston.error;
    console.log = () => {};
    winston.log = ((): winston.LoggerInstance => ({} as any)) as winston.LogMethod;
    winston.info = ((): winston.LoggerInstance => ({} as any)) as winston.LeveledLogMethod;
    winston.error = ((): winston.LoggerInstance => ({} as any)) as winston.LeveledLogMethod;
    callback();
    setImmediate(() => {
        console.log = consoleLog;
        winston.log = winstonLog;
        winston.info = winstonInfo;
        winston.error = winstonError;
        done();
    });
};

describe('Tracer', () => {
    const message = 'Log message';

    describe('Info', () => {
        it('should start trace', done => {
            disableLogs(() => {
                winston.info('Wtf -------------------------');
                const startTraceSpy = sinon.spy(tracer, 'startTrace');
                tracer.info(message);    
                expect(startTraceSpy).to.be.calledOnce;
                startTraceSpy.restore();
            }, done);
        });
    
        it('should call winston.info', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.info(message);
                expect(winstonErrorSpy).not.to.be.called;
                expect(winstonInfoSpy).to.be.calledOnceWith('', message);
                winstonErrorSpy.restore();
                winstonInfoSpy.restore();
            }, done);
        });

        it('should call winston.info with indentation when called from traced function', done => {
            disableLogs(() => {
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.trace(() => tracer.info(message))();
                // The trace function calls winston.info
                expect(winstonInfoSpy).to.be.calledTwice;
                const infoArguments = winstonInfoSpy.getCall(1).args;
                expect(infoArguments[0]).to.equal('    ');
                expect(infoArguments[1]).to.equal(message);
                winstonInfoSpy.restore();
            }, done);
        });
    });

    describe('Error', () => {
        it('should start trace', done => {
            disableLogs(() => {
                const startTraceSpy = sinon.spy(tracer, 'startTrace');
                tracer.error(message);    
                expect(startTraceSpy).to.be.calledOnce;
                startTraceSpy.restore();
            }, done);
        });
    
        it('should call winston.error', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                const winstonInfoSpy = sinon.spy(winston, 'info');
                tracer.error(message);
                expect(winstonErrorSpy).to.be.calledOnceWith('', message);
                expect(winstonInfoSpy).not.to.be.called;
                winstonErrorSpy.restore();
                winstonInfoSpy.restore();
            }, done);
        });

        it('should call winston.error with indentation when called from traced function', done => {
            disableLogs(() => {
                const winstonErrorSpy = sinon.spy(winston, 'error');
                tracer.trace(() => tracer.error(message))();
                expect(winstonErrorSpy).to.be.calledOnceWith('    ', message);
                winstonErrorSpy.restore();
            }, done);
        });
    });
});