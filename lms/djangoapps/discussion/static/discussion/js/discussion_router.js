(function(define) {
    'use strict';

    define(
        [
            'underscore',
            'backbone',
            'common/js/discussion/utils',
            'common/js/discussion/views/discussion_thread_view'
        ],
        function(_, Backbone, DiscussionUtil, DiscussionThreadView) {
            var DiscussionRouter = Backbone.Router.extend({
                routes: {
                    '': 'allThreads',
                    ':forum_name/threads/:thread_id': 'showThread'
                },

                initialize: function(options) {
                    Backbone.Router.prototype.initialize.call(this);
                    _.bindAll(this, 'allThreads', 'showThread');
                    this.courseId = options.courseId;
                    this.discussion = options.discussion;
                    this.course_settings = options.courseSettings;
                    this.discussionBoardView = options.discussionBoardView;
                    this.newPostView = options.newPostView;
                },

                start: function() {
                    var self = this,
                        $newPostButton = $('.new-post-btn');
                    this.listenTo(this.newPostView, 'newPost:cancel', this.hideNewPost);
                    $newPostButton.bind('click', _.bind(this.showNewPost, this));
                    $newPostButton.bind('keydown', function(event) {
                        DiscussionUtil.activateOnSpace(event, self.showNewPost);
                    });

                    // Automatically navigate when the user selects threads
                    this.discussionBoardView.discussionThreadListView.on(
                        'thread:selected', _.bind(this.navigateToThread, this)
                    );
                    this.discussionBoardView.discussionThreadListView.on(
                        'thread:removed', _.bind(this.navigateToAllThreads, this)
                    );
                    this.discussionBoardView.discussionThreadListView.on(
                        'threads:rendered', _.bind(this.setActiveThread, this)
                    );
                    this.discussionBoardView.discussionThreadListView.on(
                        'thread:created', _.bind(this.navigateToThread, this)
                    );
                    var root_url = '/courses/' + this.courseId + '/discussion/';
                    var result = window.location.pathname.match('.*/discussion');
                    root_url = (result !== null) ? result[0] + '/' : root_url;
                    Backbone.history.start({
                        pushState: true,
                        root: root_url
                    });
                },

                stop: function() {
                    Backbone.history.stop();
                },

                allThreads: function() {
                    this.discussionBoardView.updateSidebar();
                    return this.discussionBoardView.goHome();
                },

                setActiveThread: function() {
                    if (this.thread) {
                        return this.discussionBoardView.discussionThreadListView.setActiveThread(this.thread.get('id'));
                    } else {
                        return this.discussionBoardView.goHome;
                    }
                },

                showThread: function(forumName, threadId) {
                    this.thread = this.discussion.get(threadId);
                    if (typeof this.thread === 'undefined') {
                        DiscussionUtil.discussionAlert(
                            gettext('Error'),
                            gettext('You are not permitted to view this discussion.')
                        );
                        return;
                    }
                    this.thread.set('unread_comments_count', 0);
                    this.thread.set('read', true);
                    this.setActiveThread();
                    return this.showMain();
                },

                showMain: function() {
                    var self = this;
                    if (this.main) {
                        this.main.cleanup();
                        this.main.undelegateEvents();
                    }
                    if (!($('.forum-content').is(':visible'))) {
                        $('.forum-content').fadeIn();
                    }
                    if ($('.new-post-article').is(':visible')) {
                        $('.new-post-article').fadeOut();
                    }
                    this.main = new DiscussionThreadView({
                        el: $('.forum-content'),
                        model: this.thread,
                        mode: 'tab',
                        course_settings: this.course_settings
                    });
                    this.main.render();
                    this.main.on('thread:responses:rendered', function() {
                        return self.discussionBoardView.updateSidebar();
                    });
                    return this.thread.on('thread:thread_type_updated', this.showMain);
                },

                navigateToThread: function(threadId) {
                    var thread = this.discussion.get(threadId);
                    return this.navigate('' + (thread.get('commentable_id')) + '/threads/' + threadId, {
                        trigger: true
                    });
                },

                navigateToAllThreads: function() {
                    return this.navigate('', {
                        trigger: true
                    });
                },

                showNewPost: function() {
                    var self = this;
                    return $('.forum-content').fadeOut({
                        duration: 200,
                        complete: function() {
                            return self.newPostView.$el.fadeIn(200).focus();
                        }
                    });
                },

                hideNewPost: function() {
                    return this.newPostView.$el.fadeOut({
                        duration: 200,
                        complete: function() {
                            return $('.forum-content').fadeIn(200).find('.thread-wrapper')
                                .focus();
                        }
                    });
                }

            });

            return DiscussionRouter;
        });
}).call(this, define || RequireJS.define);
