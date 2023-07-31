/** @format */

import log, { LoggingMethod } from "loglevel";

export type Logger = log.Logger;

export class LogFactory {
	static create(namespace: string): log.Logger 
	{
		const logger = log.getLogger(namespace);
		logger.setLevel("DEBUG");
		const originalFactory = logger.methodFactory;
		logger.methodFactory = function (methodName, logLevel, loggerName): LoggingMethod 
		{
			const rawMethod = originalFactory(methodName, logLevel, loggerName);

			return function (...args: any[]) 
			{
				const messages = [`[${namespace}] `].concat(args);
				rawMethod(...messages);
			};
		};

		logger.setLevel(logger.getLevel());
		return logger;
	}
}
